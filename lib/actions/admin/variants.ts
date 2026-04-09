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
  await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const id = await createVariant(parsed.data)
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El SKU o código externo ya existe." }
    return { error: "Error al crear variante." }
  }
}

export async function updateVariantAction(id: string, productId: string, data: unknown) {
  await requireAdmin()
  if (!id || !productId) return { error: "ID requerido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    await updateVariant(id, productId, parsed.data)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El SKU o código externo ya existe." }
    return { error: "Error al actualizar variante." }
  }
}

export async function deleteVariantAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  try {
    await deleteVariant(id)
    return { success: true }
  } catch {
    return { error: "Error al eliminar variante." }
  }
}

export async function bulkDeleteVariantsAction(ids: string[]) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron variantes." }
  const deleted = await bulkDeleteVariants(ids)
  return { deleted }
}

export async function bulkToggleVariantsAction(ids: string[], active: boolean) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron variantes." }
  await bulkUpdateVariantsActive(ids, active)
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
