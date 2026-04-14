"use server"

import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders, payments, users } from "@/lib/db/schema"
import { getGateway } from "@/lib/payments/registry"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { logEvent } from "@/lib/logging"
import { getSiteUrl } from "@/lib/get-base-url"
import { getGatewayInstanceBySlug } from "@/lib/actions/admin/gateway-config"
import { getFlowForOrder } from "@/lib/order-flow-resolver"
import "@/lib/payments/init"
import type { CreatePaymentInput } from "@/lib/payments/types"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Create a payment for an existing order using the specified gateway instance (by slug).
 * Resolves customer data from the authenticated user.
 */
export async function createPayment(
  orderId: string,
  gatewaySlug: string,
  customer: { name: string; email: string; cpf: string },
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autenticado" }
  if (!UUID_RE.test(orderId)) return { error: "ID inválido" }

  const rl = await rateLimit(`create-payment:${session.user.id}`, 5, 60)
  if (!rl.success) return { error: "Demasiados intentos. Espere un momento." }

  // Load gateway instance by slug
  const instance = await getGatewayInstanceBySlug(gatewaySlug)
  if (!instance) return { error: "Gateway no encontrado o inactivo" }

  const gateway = getGateway(instance.type)

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, total: true, status: true, userId: true },
  })

  if (!order) return { error: "Pedido no encontrado" }
  if (order.userId !== session.user.id) return { error: "No autorizado" }
  if (order.status !== "pending") {
    return { error: "El pedido no está pendiente" }
  }

  // Atomic lock: set order status to prevent concurrent payment creation
  const [locked] = await db
    .update(orders)
    .set({ status: "pending" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id })

  if (!locked) {
    return { error: "El pedido ya está siendo procesado" }
  }

  // Resolve customer from user record
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, email: true, documentNumber: true },
  })
  const resolvedCustomer = {
    name: customer.name || user?.name || "Cliente",
    email: customer.email || user?.email || "",
    cpf: customer.cpf || user?.documentNumber || "",
  }

  const baseUrl = getSiteUrl()

  // Convert numeric(10,2) total to cents
  const amountCents = Math.round(Number(order.total) * 100)

  const input: CreatePaymentInput = {
    orderId,
    amountCents,
    description: `Pedido #${orderId.slice(0, 8)}`,
    customer: resolvedCustomer,
    postbackUrl: `${baseUrl}/api/webhooks/${instance.type}`,
  }

  let result
  try {
    result = await gateway.createPayment(input, instance.decryptedCredentials)
  } catch (err) {
    await logEvent({ category: "pedidos", level: "error", action: "payment-create-error", message: `Gateway error: ${(err as Error).message}`, entityId: orderId, meta: { orderId, gateway: gatewaySlug, error: (err as Error).message } })
    // Cancel the order to avoid orphaned orders
    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId))
    const userMsg = (err as Error & { userMessage?: string }).userMessage
    return { error: userMsg || "Error al crear el pago en el gateway. Intente de nuevo." }
  }

  // Check flow for auto_transition on the "pending" step
  const flow = await getFlowForOrder(orderId)
  const pendingStep = flow?.steps.find((s) => s.statusSlug === "pending")
  const isAutoConfirm = pendingStep?.autoTransition ?? false

  // Determine next status from flow
  const nextStatus = (() => {
    if (!flow || !isAutoConfirm) return null
    const pendingIdx = flow.steps.findIndex((s) => s.statusSlug === "pending")
    if (pendingIdx >= 0 && pendingIdx + 1 < flow.steps.length) {
      return flow.steps[pendingIdx + 1].statusSlug
    }
    return "confirmed"
  })()

  // Save payment record
  await db.insert(payments).values({
    orderId,
    gateway: gatewaySlug,
    externalId: result.externalId,
    status: isAutoConfirm ? "succeeded" : "pending",
    amount: amountCents,
    metadata: result.data,
    ...(isAutoConfirm ? { paidAt: new Date() } : {}),
  })

  // Auto-transition if the flow says so (e.g., in-store cash/card payments)
  if (isAutoConfirm && nextStatus) {
    await db
      .update(orders)
      .set({ status: nextStatus })
      .where(eq(orders.id, orderId))

    await logEvent({
      category: "pedidos",
      level: "info",
      action: "payment-auto-confirmed",
      message: `Pago (${instance.type}) auto-confirmado → ${nextStatus} para pedido ${orderId.slice(0, 8)}`,
      entityId: orderId,
      userId: session.user.id,
    })
  }

  return {
    success: true,
    gateway: gatewaySlug,
    data: result.data,
  }
}
