"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import { updateOrderStatus } from "@/services/orders"

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingCode: z.string().max(100).optional(),
})

export async function updateOrderStatusAction(orderId: string, data: unknown) {
  await requireAdmin()
  if (!orderId) return { error: "ID requerido." }

  const parsed = updateStatusSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await updateOrderStatus(orderId, parsed.data.status, parsed.data.trackingCode)
    return { success: true }
  } catch {
    return { error: "Error al actualizar el estado." }
  }
}
