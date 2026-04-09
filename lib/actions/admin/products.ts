"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductsActive,
} from "@/services/admin/products"

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const specItemSchema = z.object({ label: z.string(), value: z.string() })
const i18nSpecsSchema = z.record(z.string(), z.array(specItemSchema)).optional()

const createSchema = z.object({
  categoryId: z.string().uuid(),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  specs: i18nSpecsSchema,
  review: i18nTextSchema.optional(),
  included: i18nTextSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  images: z.array(z.string().max(500)).max(20).optional(),
})

const updateSchema = createSchema.partial()

export async function createProductAction(data: unknown) {
  await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const id = await createProduct(parsed.data)
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear producto." }
  }
}

export async function updateProductAction(id: string, data: unknown) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    await updateProduct(id, parsed.data)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  try {
    await deleteProduct(id)
    return { success: true }
  } catch {
    return { error: "Error al eliminar producto." }
  }
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron productos." }
  const deleted = await bulkDeleteProducts(ids)
  return { deleted }
}

export async function bulkToggleProductsAction(ids: string[], active: boolean) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron productos." }
  await bulkUpdateProductsActive(ids, active)
  return { success: true }
}
