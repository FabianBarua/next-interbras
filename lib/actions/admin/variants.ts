"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createVariant,
  updateVariant,
  deleteVariant,
  bulkDeleteVariants,
  bulkUpdateVariantsActive,
  bulkCreateVariants,
} from "@/services/admin/variants"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

const externalCodeSchema = z.object({
  system: z.string().min(1).max(50),
  code: z.string().min(1).max(100),
  externalName: z.string().max(255).optional(),
  priceUsd: z.string().max(20).optional(),
  priceGs: z.string().max(20).optional(),
  priceBrl: z.string().max(20).optional(),
}).optional()

const createSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(100),
  options: z.record(z.string(), z.string()),
  stock: z.number().int().min(0).nullable().optional(),
  unitsPerBox: z.number().int().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  images: z.array(z.string().max(500)).max(20).optional(),
  externalCode: externalCodeSchema,
})

const updateSchema = createSchema.omit({ productId: true }).partial()

export async function createVariantAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const id = await createVariant(parsed.data)
    logEvent({ category: "admin", action: "variant.create", entity: "variant", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El SKU o código externo ya existe." }
    return { error: "Error al crear variante." }
  }
}

export async function updateVariantAction(id: string, productId: string, data: unknown) {
  const session = await requireAdmin()
  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(productId).success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    await updateVariant(id, productId, parsed.data)
    logEvent({ category: "admin", action: "variant.update", entity: "variant", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El SKU o código externo ya existe." }
    return { error: "Error al actualizar variante." }
  }
}

export async function deleteVariantAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteVariant(id)
    logEvent({ category: "admin", action: "variant.delete", entity: "variant", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar variante." }
  }
}

export async function bulkDeleteVariantsAction(ids: unknown) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  const deleted = await bulkDeleteVariants(parsed.data)
  logEvent({ category: "admin", action: "variant.bulk_delete", entity: "variant", userId: session.id, meta: { count: deleted } })
  return { deleted }
}

export async function bulkToggleVariantsAction(ids: unknown, active: boolean) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  await bulkUpdateVariantsActive(parsed.data, active)
  logEvent({ category: "admin", action: "variant.bulk_toggle", entity: "variant", userId: session.id, meta: { count: parsed.data.length, active } })
  return { success: true }
}

const bulkCreateSchema = z.array(createSchema).min(1).max(50)

export async function bulkCreateVariantsAction(data: unknown) {
  await requireAdmin()
  const parsed = bulkCreateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const ids = await bulkCreateVariants(parsed.data)
    return { ids }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "SKU o código externo duplicado." }
    return { error: "Error al crear variantes." }
  }
}
