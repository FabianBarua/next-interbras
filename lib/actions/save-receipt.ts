"use server"

import { eq, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import { logEvent } from "@/lib/logging"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Attach a receipt URL to the latest payment record of an order (transfer).
 * Only works for orders with paymentMethod === 'transfer' owned by the current user.
 */
export async function saveReceiptAction(
  orderId: string,
  receiptUrl: string,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autenticado" }
  if (!UUID_RE.test(orderId)) return { error: "ID de pedido inválido" }
  if (!receiptUrl.startsWith("/uploads/receipts/")) return { error: "URL de comprobante inválida" }

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
    columns: { id: true, paymentMethod: true },
  })

  if (!order) return { error: "Pedido no encontrado" }
  if (order.paymentMethod !== "transfer") return { error: "Este pedido no es por transferencia" }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
    orderBy: desc(payments.createdAt),
    columns: { id: true, metadata: true },
  })

  if (!payment) return { error: "No se encontró el pago" }

  const existingMeta = (payment.metadata ?? {}) as Record<string, unknown>

  await db
    .update(payments)
    .set({
      metadata: {
        ...existingMeta,
        receiptUrl,
        receiptUploadedAt: new Date().toISOString(),
      },
    })
    .where(eq(payments.id, payment.id))

  await logEvent({
    category: "pedidos",
    level: "info",
    action: "receipt-uploaded",
    message: `Comprobante subido para pedido ${orderId.slice(0, 8)}`,
    entityId: orderId,
    userId: session.user.id,
    meta: { receiptUrl },
  })

  return {}
}
