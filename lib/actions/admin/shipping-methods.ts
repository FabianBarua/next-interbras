"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "@/services/shipping-methods"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const createSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  price: z.number().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const updateSchema = createSchema.partial()

export async function createShippingMethodAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    const id = await createShippingMethod(parsed.data)
    logEvent({ category: "admin", action: "shipping_method.create", entity: "shipping_method", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear método de envío." }
  }
}

export async function updateShippingMethodAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await updateShippingMethod(id, parsed.data)
    logEvent({ category: "admin", action: "shipping_method.update", entity: "shipping_method", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteShippingMethodAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  await deleteShippingMethod(id)
  logEvent({ category: "admin", action: "shipping_method.delete", entity: "shipping_method", entityId: id, userId: session.id })
  return { success: true }
}
