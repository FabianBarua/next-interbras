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
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

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
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const id = await createProduct(parsed.data)
    logEvent({ category: "admin", action: "product.create", entity: "product", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear producto." }
  }
}

export async function updateProductAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    await updateProduct(id, parsed.data)
    logEvent({ category: "admin", action: "product.update", entity: "product", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteProductAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteProduct(id)
    logEvent({ category: "admin", action: "product.delete", entity: "product", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar producto." }
  }
}

export async function bulkDeleteProductsAction(ids: unknown) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  const deleted = await bulkDeleteProducts(parsed.data)
  logEvent({ category: "admin", action: "product.bulk_delete", entity: "product", userId: session.id, meta: { count: deleted } })
  return { deleted }
}

export async function bulkToggleProductsAction(ids: unknown, active: boolean) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  await bulkUpdateProductsActive(parsed.data, active)
  logEvent({ category: "admin", action: "product.bulk_toggle", entity: "product", userId: session.id, meta: { count: parsed.data.length, active } })
  return { success: true }
}
