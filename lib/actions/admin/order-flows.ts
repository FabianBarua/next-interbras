"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createOrderFlow,
  updateOrderFlow,
  deleteOrderFlow,
  setFlowSteps,
} from "@/services/admin/order-flows"
import { logEvent } from "@/lib/logging"

const createSchema = z.object({
  name: z.record(z.string(), z.string().min(1)).refine((v) => Object.keys(v).length > 0, "Al menos un idioma"),
  description: z.record(z.string(), z.string()).optional(),
  shippingMethodId: z.string().uuid().nullable().optional(),
  gatewayType: z.string().max(50).nullable().optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

const stepSchema = z.object({
  statusSlug: z.string().min(1).max(50),
  autoTransition: z.boolean(),
  notifyCustomer: z.boolean(),
})

const stepsSchema = z.array(stepSchema).min(1, "Al menos un paso es requerido")

export async function createOrderFlowAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  try {
    const id = await createOrderFlow(parsed.data)
    logEvent({ category: "admin", action: "order_flow.create", entity: "order_flow", entityId: id, userId: session.id })
    return { success: true, id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique")) return { error: "Ya existe un flujo con esa combinación envío/pago." }
    return { error: "Error al crear el flujo." }
  }
}

export async function updateOrderFlowAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const uuidResult = z.string().uuid().safeParse(id)
  if (!uuidResult.success) return { error: "ID inválido." }

  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  try {
    await updateOrderFlow(id, parsed.data)
    logEvent({ category: "admin", action: "order_flow.update", entity: "order_flow", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al actualizar el flujo." }
  }
}

export async function deleteOrderFlowAction(id: string) {
  const session = await requireAdmin()
  const uuidResult = z.string().uuid().safeParse(id)
  if (!uuidResult.success) return { error: "ID inválido." }

  try {
    await deleteOrderFlow(id)
    logEvent({ category: "admin", action: "order_flow.delete", entity: "order_flow", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar el flujo." }
  }
}

export async function updateFlowStepsAction(flowId: string, data: unknown) {
  const session = await requireAdmin()
  const uuidResult = z.string().uuid().safeParse(flowId)
  if (!uuidResult.success) return { error: "ID de flujo inválido." }

  const parsed = stepsSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pasos inválidos." }

  try {
    await setFlowSteps(flowId, parsed.data)
    logEvent({ category: "admin", action: "order_flow.update_steps", entity: "order_flow", entityId: flowId, userId: session.id, meta: { stepCount: parsed.data.length } })
    return { success: true }
  } catch {
    return { error: "Error al actualizar los pasos." }
  }
}
