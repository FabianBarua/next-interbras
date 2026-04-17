"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import { updateOrderStatus } from "@/services/orders"
import { isValidTransition } from "@/lib/order-flow-resolver"
import { logEvent } from "@/lib/logging"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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

  const newStatus = parsed.data.status

  // Check current status — skip validation if unchanged
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true },
  })
  if (!order) return { error: "Pedido no encontrado." }

  if (newStatus !== order.status) {
    const valid = await isValidTransition(orderId, newStatus)
    if (!valid) return { error: "Transición de estado no permitida según el flujo del pedido." }
  }

  try {
    await updateOrderStatus(orderId, newStatus, parsed.data.trackingCode)
    logEvent({ category: "admin", action: "order.update_status", entity: "order", entityId: orderId, userId: session.id, meta: { status: newStatus } })
    return { success: true }
  } catch {
    return { error: "Error al actualizar el estado." }
  }
}
