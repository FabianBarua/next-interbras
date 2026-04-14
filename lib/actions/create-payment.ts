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
  if (order.status !== "PENDING" && order.status !== "PROCESSING") {
    return { error: "El pedido no está pendiente" }
  }

  // Atomic lock: set order to PROCESSING to prevent concurrent payment creation
  const [locked] = await db
    .update(orders)
    .set({ status: "PROCESSING" })
    .where(and(eq(orders.id, orderId), eq(orders.status, order.status)))
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
      .set({ status: "CANCELLED" })
      .where(eq(orders.id, orderId))
    const userMsg = (err as Error & { userMessage?: string }).userMessage
    return { error: userMsg || "Error al crear el pago en el gateway. Intente de nuevo." }
  }

  // Save payment record (stores instance slug in gateway column)
  await db.insert(payments).values({
    orderId,
    gateway: gatewaySlug,
    externalId: result.externalId,
    status: "pending",
    amount: amountCents,
    metadata: result.data,
  })

  return {
    success: true,
    gateway: gatewaySlug,
    data: result.data,
  }
}
