"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createOrderStatus,
  updateOrderStatus,
  deleteOrderStatus,
} from "@/services/admin/order-statuses"
import { logEvent } from "@/lib/logging"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const createSchema = z.object({
  slug: z.string().min(2).max(50).regex(slugRegex, "Slug debe ser lowercase con guiones"),
  name: z.record(z.string(), z.string().min(1)).refine((v) => Object.keys(v).length > 0, "Al menos un idioma"),
  description: z.record(z.string(), z.string()).optional(),
  color: z.string().max(30).optional(),
  icon: z.string().max(50).optional(),
  isFinal: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial().omit({ slug: true })

export async function createOrderStatusAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  try {
    const id = await createOrderStatus(parsed.data)
    logEvent({ category: "admin", action: "order_status.create", entity: "order_status", entityId: id, userId: session.id, meta: { slug: parsed.data.slug } })
    return { success: true, id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique")) return { error: "Ya existe un estado con ese slug." }
    return { error: "Error al crear el estado." }
  }
}

export async function updateOrderStatusAction(slug: string, data: unknown) {
  const session = await requireAdmin()
  if (!slug || typeof slug !== "string") return { error: "Slug inválido." }

  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }

  try {
    await updateOrderStatus(slug, parsed.data)
    logEvent({ category: "admin", action: "order_status.update", entity: "order_status", entityId: slug, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al actualizar el estado." }
  }
}

export async function deleteOrderStatusAction(slug: string) {
  const session = await requireAdmin()
  if (!slug || typeof slug !== "string") return { error: "Slug inválido." }

  try {
    await deleteOrderStatus(slug)
    logEvent({ category: "admin", action: "order_status.delete", entity: "order_status", entityId: slug, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar el estado." }
  }
}
