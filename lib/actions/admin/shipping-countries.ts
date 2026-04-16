"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import { db } from "@/lib/db"
import { shippingMethodCountries, countries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

export async function getCountriesForShippingMethod(shippingMethodId: string) {
  await requireAdmin()
  const rows = await db
    .select({ countryId: shippingMethodCountries.countryId, code: countries.code })
    .from(shippingMethodCountries)
    .innerJoin(countries, eq(shippingMethodCountries.countryId, countries.id))
    .where(eq(shippingMethodCountries.shippingMethodId, shippingMethodId))
  return rows
}

export async function updateShippingCountriesAction(shippingMethodId: string, countryIds: string[]) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(shippingMethodId)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = z.array(z.string().uuid()).safeParse(countryIds)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await db.delete(shippingMethodCountries)
      .where(eq(shippingMethodCountries.shippingMethodId, shippingMethodId))

    if (parsed.data.length > 0) {
      await db.insert(shippingMethodCountries).values(
        parsed.data.map((countryId) => ({
          shippingMethodId,
          countryId,
        })),
      )
    }

    await invalidateCache("shipping-by-country:*", "countries:*")
    logEvent({
      category: "admin",
      action: "shipping_countries.update",
      entity: "shipping_method",
      entityId: shippingMethodId,
      userId: session.id,
      meta: { countryIds: parsed.data },
    })
    return { success: true }
  } catch {
    return { error: "Error al actualizar asignación de países." }
  }
}
