"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoriesActive,
} from "@/services/admin/categories"

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
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function createCategoryAction(data: unknown) {
  await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const id = await createCategory(parsed.data)
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear categoría." }
  }
}

export async function updateCategoryAction(id: string, data: unknown) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateCategory(id, parsed.data)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  try {
    await deleteCategory(id)
    return { success: true }
  } catch {
    return { error: "No se puede eliminar: tiene productos asociados." }
  }
}

export async function bulkDeleteCategoriesAction(ids: string[]) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron categorías." }
  const deleted = await bulkDeleteCategories(ids)
  return { deleted }
}

export async function bulkToggleCategoriesAction(ids: string[], active: boolean) {
  await requireAdmin()
  if (!ids?.length) return { error: "No se seleccionaron categorías." }
  await bulkUpdateCategoriesActive(ids, active)
  return { success: true }
}
