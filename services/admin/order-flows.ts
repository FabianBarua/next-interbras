import { db } from "@/lib/db"
import { orderFlows, orderFlowSteps } from "@/lib/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { OrderFlow, OrderFlowStep } from "@/types/order-flow"
import type { I18nText } from "@/types/common"

function mapFlow(row: typeof orderFlows.$inferSelect, steps: OrderFlowStep[] = []): OrderFlow {
  return {
    id: row.id,
    name: row.name as I18nText,
    description: (row.description as I18nText) ?? null,
    shippingMethodId: row.shippingMethodId,
    gatewayType: row.gatewayType,
    isDefault: row.isDefault,
    active: row.active,
    steps,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  }
}

function mapStep(row: typeof orderFlowSteps.$inferSelect): OrderFlowStep {
  return {
    id: row.id,
    flowId: row.flowId,
    statusSlug: row.statusSlug,
    stepOrder: row.stepOrder,
    autoTransition: row.autoTransition,
    notifyCustomer: row.notifyCustomer,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  }
}

export async function getAllOrderFlows(): Promise<OrderFlow[]> {
  const rows = await db.select().from(orderFlows).orderBy(asc(orderFlows.createdAt))
  const allSteps = await db.select().from(orderFlowSteps).orderBy(asc(orderFlowSteps.stepOrder))

  const stepsByFlow = new Map<string, OrderFlowStep[]>()
  for (const s of allSteps) {
    const list = stepsByFlow.get(s.flowId) ?? []
    list.push(mapStep(s))
    stepsByFlow.set(s.flowId, list)
  }

  return rows.map((r) => mapFlow(r, stepsByFlow.get(r.id) ?? []))
}

export async function getOrderFlowById(id: string): Promise<OrderFlow | null> {
  const rows = await db.select().from(orderFlows).where(eq(orderFlows.id, id)).limit(1)
  if (!rows[0]) return null

  const steps = await getFlowSteps(id)
  return mapFlow(rows[0], steps)
}

export async function getFlowSteps(flowId: string): Promise<OrderFlowStep[]> {
  const rows = await db
    .select()
    .from(orderFlowSteps)
    .where(eq(orderFlowSteps.flowId, flowId))
    .orderBy(asc(orderFlowSteps.stepOrder))
  return rows.map(mapStep)
}

export async function createOrderFlow(input: {
  name: I18nText
  description?: I18nText
  shippingMethodId?: string | null
  gatewayType?: string | null
  isDefault?: boolean
  active?: boolean
}): Promise<string> {
  const [row] = await db.insert(orderFlows).values({
    name: input.name,
    description: input.description,
    shippingMethodId: input.shippingMethodId ?? null,
    gatewayType: input.gatewayType ?? null,
    isDefault: input.isDefault ?? false,
    active: input.active ?? true,
  }).returning({ id: orderFlows.id })
  await invalidateCache("order-flows:*")
  return row.id
}

export async function updateOrderFlow(id: string, input: {
  name?: I18nText
  description?: I18nText
  shippingMethodId?: string | null
  gatewayType?: string | null
  isDefault?: boolean
  active?: boolean
}): Promise<void> {
  await db.update(orderFlows).set(input).where(eq(orderFlows.id, id))
  await invalidateCache("order-flows:*")
}

export async function deleteOrderFlow(id: string): Promise<void> {
  // Steps cascade-delete via FK
  await db.delete(orderFlows).where(eq(orderFlows.id, id))
  await invalidateCache("order-flows:*")
}

export async function setFlowSteps(
  flowId: string,
  steps: { statusSlug: string; autoTransition: boolean; notifyCustomer: boolean }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete existing steps, then insert new ones
    await tx.delete(orderFlowSteps).where(eq(orderFlowSteps.flowId, flowId))

    if (steps.length > 0) {
      await tx.insert(orderFlowSteps).values(
        steps.map((s, i) => ({
          flowId,
          statusSlug: s.statusSlug,
          stepOrder: i,
          autoTransition: s.autoTransition,
          notifyCustomer: s.notifyCustomer,
        })),
      )
    }
  })

  await invalidateCache("order-flows:*")
}
