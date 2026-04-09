import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq, asc, count } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { Category } from "@/types/category"
import type { I18nText, I18nRichText } from "@/types/common"

function mapRow(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: (row.description as I18nRichText) ?? null,
    shortDescription: (row.shortDescription as I18nText) ?? null,
    image: row.image ?? null,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
  return rows.map(mapRow)
}

export async function getCategoryByIdAdmin(id: string): Promise<Category | null> {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  return rows[0] ? mapRow(rows[0]) : null
}

export interface CreateCategoryInput {
  slug: string
  name: I18nText
  description?: I18nRichText
  shortDescription?: I18nText
  image?: string
  sortOrder?: number
  active?: boolean
}

export async function createCategory(input: CreateCategoryInput): Promise<string> {
  const [row] = await db.insert(categories).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    shortDescription: input.shortDescription,
    image: input.image,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: categories.id })
  await invalidateCache("categories:*", "category:*", "products:*", "variants:*")
  return row.id
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>): Promise<void> {
  await db.update(categories).set(input).where(eq(categories.id, id))
  await invalidateCache("categories:*", "category:*", "products:*", "variants:*")
}

export async function deleteCategory(id: string): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id))
  await invalidateCache("categories:*", "category:*", "products:*", "variants:*")
}

export async function bulkDeleteCategories(ids: string[]): Promise<number> {
  let deleted = 0
  for (const id of ids) {
    try {
      await db.delete(categories).where(eq(categories.id, id))
      deleted++
    } catch { /* skip FK conflicts */ }
  }
  await invalidateCache("categories:*", "category:*", "products:*", "variants:*")
  return deleted
}

export async function bulkUpdateCategoriesActive(ids: string[], active: boolean): Promise<void> {
  for (const id of ids) {
    await db.update(categories).set({ active }).where(eq(categories.id, id))
  }
  await invalidateCache("categories:*", "category:*")
}
