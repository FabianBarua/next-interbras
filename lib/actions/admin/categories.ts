"use server"

import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoriesActive,
} from "@/services/admin/categories"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  shortDescription: i18nTextSchema.optional(),
  image: z.string().max(500).optional(),
  svgIcon: z.string().max(50000).nullable().optional(),
  svgIconMeta: z.object({ library: z.string(), name: z.string() }).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function createCategoryAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  const cleanData = {
    ...parsed.data,
    ...(parsed.data.svgIcon ? { svgIcon: DOMPurify.sanitize(parsed.data.svgIcon, { USE_PROFILES: { svg: true, svgFilters: true } }) } : {}),
  }
  try {
    const id = await createCategory(cleanData)
    logEvent({ category: "admin", action: "category.create", entity: "category", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear categoría." }
  }
}

export async function updateCategoryAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  const cleanData = {
    ...parsed.data,
    ...(parsed.data.svgIcon ? { svgIcon: DOMPurify.sanitize(parsed.data.svgIcon, { USE_PROFILES: { svg: true, svgFilters: true } }) } : {}),
  }
  try {
    await updateCategory(id, cleanData)
    logEvent({ category: "admin", action: "category.update", entity: "category", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteCategory(id)
    logEvent({ category: "admin", action: "category.delete", entity: "category", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "No se puede eliminar: tiene productos asociados." }
  }
}

export async function bulkDeleteCategoriesAction(ids: unknown) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  const deleted = await bulkDeleteCategories(parsed.data)
  logEvent({ category: "admin", action: "category.bulk_delete", entity: "category", userId: session.id, meta: { count: deleted } })
  return { deleted }
}

export async function bulkToggleCategoriesAction(ids: unknown, active: boolean) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  await bulkUpdateCategoriesActive(parsed.data, active)
  logEvent({ category: "admin", action: "category.bulk_toggle", entity: "category", userId: session.id, meta: { count: parsed.data.length, active } })
  return { success: true }
}
