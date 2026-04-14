"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import { updateOrderStatus } from "@/services/orders"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

const updateStatusSchema = z.object({
  status: z.string().min(1).max(50),
  trackingCode: z.string().max(100).optional(),
})

export async function updateOrderStatusAction(orderId: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(orderId)
  if (!idParsed.success) return { error: "ID inválido." }

  const parsed = updateStatusSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await updateOrderStatus(orderId, parsed.data.status, parsed.data.trackingCode)
    logEvent({ category: "admin", action: "order.update_status", entity: "order", entityId: orderId, userId: session.id, meta: { status: parsed.data.status } })
    return { success: true }
  } catch {
    return { error: "Error al actualizar el estado." }
  }
}
