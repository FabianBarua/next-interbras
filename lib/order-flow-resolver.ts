import { db } from "@/lib/db"
import { orderFlows, orderFlowSteps, orders } from "@/lib/db/schema"
import { eq, and, asc, isNull } from "drizzle-orm"
import { cachedQuery } from "@/lib/cache"
import type { OrderFlow, OrderFlowStep } from "@/types/order-flow"
import type { I18nText } from "@/types/common"

/**
 * Resolve which flow applies for a given shipping method + gateway type.
 * Priority: exact match > shipping-only > gateway-only > default
 */
export async function resolveFlow(
  shippingMethodId: string | null,
  gatewayType: string | null,
): Promise<OrderFlow | null> {
  const allFlows = await cachedQuery("order-flows:all", async () => {
    const rows = await db.select().from(orderFlows).where(eq(orderFlows.active, true))
    const allSteps = await db.select().from(orderFlowSteps).orderBy(asc(orderFlowSteps.stepOrder))

    const stepsByFlow = new Map<string, OrderFlowStep[]>()
    for (const s of allSteps) {
      const list = stepsByFlow.get(s.flowId) ?? []
      list.push({
        id: s.id,
        flowId: s.flowId,
        statusSlug: s.statusSlug,
        stepOrder: s.stepOrder,
        autoTransition: s.autoTransition,
        notifyCustomer: s.notifyCustomer,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      })
      stepsByFlow.set(s.flowId, list)
    }

    return rows.map((r) => ({
      id: r.id,
      name: r.name as I18nText,
      description: (r.description as I18nText) ?? null,
      shippingMethodId: r.shippingMethodId,
      gatewayType: r.gatewayType,
      isDefault: r.isDefault,
      active: r.active,
      steps: stepsByFlow.get(r.id) ?? [],
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }))
  }, 300)

  // Exact match: shipping + gateway
  if (shippingMethodId && gatewayType) {
    const exact = allFlows.find(
      (f) => f.shippingMethodId === shippingMethodId && f.gatewayType === gatewayType,
    )
    if (exact) return exact
  }

  // Shipping-only match
  if (shippingMethodId) {
    const shippingOnly = allFlows.find(
      (f) => f.shippingMethodId === shippingMethodId && !f.gatewayType,
    )
    if (shippingOnly) return shippingOnly
  }

  // Gateway-only match
  if (gatewayType) {
    const gatewayOnly = allFlows.find(
      (f) => !f.shippingMethodId && f.gatewayType === gatewayType,
    )
    if (gatewayOnly) return gatewayOnly
  }

  // Default flow
  return allFlows.find((f) => f.isDefault) ?? null
}

/**
 * Get the flow assigned to an order, with its steps.
 */
export async function getFlowForOrder(orderId: string): Promise<OrderFlow | null> {
  const [order] = await db
    .select({ flowId: orders.flowId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order?.flowId) return null

  const allFlows = await cachedQuery("order-flows:all", async () => {
    const rows = await db.select().from(orderFlows).where(eq(orderFlows.active, true))
    const allSteps = await db.select().from(orderFlowSteps).orderBy(asc(orderFlowSteps.stepOrder))
    const stepsByFlow = new Map<string, OrderFlowStep[]>()
    for (const s of allSteps) {
      const list = stepsByFlow.get(s.flowId) ?? []
      list.push({
        id: s.id,
        flowId: s.flowId,
        statusSlug: s.statusSlug,
        stepOrder: s.stepOrder,
        autoTransition: s.autoTransition,
        notifyCustomer: s.notifyCustomer,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      })
      stepsByFlow.set(s.flowId, list)
    }
    return rows.map((r) => ({
      id: r.id,
      name: r.name as I18nText,
      description: (r.description as I18nText) ?? null,
      shippingMethodId: r.shippingMethodId,
      gatewayType: r.gatewayType,
      isDefault: r.isDefault,
      active: r.active,
      steps: stepsByFlow.get(r.id) ?? [],
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }))
  }, 300)

  return allFlows.find((f) => f.id === order.flowId) ?? null
}

/**
 * Get the valid next status slugs for an order based on its flow.
 * Returns ALL statuses that come after the current step in the flow,
 * so the admin can advance to any future step (not just the next one).
 * Always includes "cancelled" as a valid transition.
 */
export async function getNextStatuses(orderId: string): Promise<string[]> {
  const [order] = await db
    .select({ status: orders.status, flowId: orders.flowId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return []

  const flow = await getFlowForOrder(orderId)
  if (!flow) return []

  const currentIdx = flow.steps.findIndex((s) => s.statusSlug === order.status)
  if (currentIdx === -1) return []

  // All future steps in the flow (admin can skip steps)
  const nextStatuses = flow.steps
    .slice(currentIdx + 1)
    .map((s) => s.statusSlug)

  // Always allow cancellation unless already final
  const currentStep = flow.steps[currentIdx]
  if (currentStep.statusSlug !== "cancelled" && currentStep.statusSlug !== "refunded") {
    if (!nextStatuses.includes("cancelled")) {
      nextStatuses.push("cancelled")
    }
  }

  return nextStatuses
}

/**
 * Check if a status transition is valid for an order.
 */
export async function isValidTransition(orderId: string, newStatus: string): Promise<boolean> {
  const validStatuses = await getNextStatuses(orderId)
  return validStatuses.includes(newStatus)
}
