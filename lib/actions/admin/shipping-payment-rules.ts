"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import { db } from "@/lib/db"
import { shippingPaymentRules, gatewayConfig } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

export async function getPaymentRulesForShippingMethod(shippingMethodId: string) {
  await requireAdmin()
  const rows = await db
    .select({ gatewayType: shippingPaymentRules.gatewayType })
    .from(shippingPaymentRules)
    .where(eq(shippingPaymentRules.shippingMethodId, shippingMethodId))
  return rows.map((r) => r.gatewayType)
}

export async function getAllGatewayTypes() {
  await requireAdmin()
  const rows = await db
    .selectDistinct({ type: gatewayConfig.type, displayName: gatewayConfig.displayName })
    .from(gatewayConfig)
  return rows
}

export async function updatePaymentRulesAction(shippingMethodId: string, gatewayTypes: string[]) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(shippingMethodId)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = z.array(z.string().min(1).max(50)).safeParse(gatewayTypes)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await db.delete(shippingPaymentRules)
      .where(eq(shippingPaymentRules.shippingMethodId, shippingMethodId))

    if (parsed.data.length > 0) {
      await db.insert(shippingPaymentRules).values(
        parsed.data.map((gatewayType) => ({
          shippingMethodId,
          gatewayType,
        })),
      )
    }

    await invalidateCache("payment-options:*")
    logEvent({
      category: "admin",
      action: "shipping_payment_rules.update",
      entity: "shipping_method",
      entityId: shippingMethodId,
      userId: session.id,
      meta: { gatewayTypes: parsed.data },
    })
    return { success: true }
  } catch {
    return { error: "Error al actualizar reglas de pago." }
  }
}
