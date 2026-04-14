"use server"

import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import { notifyPaymentUpdate } from "@/lib/payments/notify"
import { logEvent } from "@/lib/logging"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Simulate a card payment confirmation (placeholder/demo mode).
 * Marks the payment as succeeded and the order as CONFIRMED.
 */
export async function simulateCardPayment(
  orderId: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autenticado" }
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
    columns: { id: true, paymentMethod: true, status: true },
  })

  if (!order) return { error: "Pedido no encontrado" }
  if (order.paymentMethod !== "card") return { error: "Este pedido no es por tarjeta" }
  if (!["PENDING", "PROCESSING"].includes(order.status)) {
    return { error: "El pedido no está en estado válido" }
  }

  // Update payment record to succeeded
  await db
    .update(payments)
    .set({ status: "succeeded", paidAt: new Date() })
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")))

  // Confirm order
  await db
    .update(orders)
    .set({ status: "CONFIRMED" })
    .where(eq(orders.id, orderId))

  await logEvent({
    category: "pedidos",
    level: "info",
    action: "card-simulate-paid",
    message: `Pago con tarjeta simulado para pedido ${orderId.slice(0, 8)}`,
    entityId: orderId,
    userId: session.user.id,
  })

  // Notify SSE
  await notifyPaymentUpdate(orderId, "paid")

  return {}
}
