import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq, asc, count, inArray, ilike, or, sql } from "drizzle-orm"
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
    svgIcon: row.svgIcon ?? null,
    svgIconMeta: (row.svgIconMeta as { library: string; name: string }) ?? null,
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
  svgIcon?: string | null
  svgIconMeta?: { library: string; name: string } | null
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
    svgIcon: input.svgIcon ?? null,
    svgIconMeta: input.svgIconMeta ?? null,
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
  const result = await db.delete(categories).where(inArray(categories.id, ids))
  await invalidateCache("categories:*", "category:*", "products:*", "variants:*")
  return (result as any).rowCount ?? (result as any).count ?? ids.length
}

export async function bulkUpdateCategoriesActive(ids: string[], active: boolean): Promise<void> {
  await db.update(categories).set({ active }).where(inArray(categories.id, ids))
  await invalidateCache("categories:*", "category:*")
}

export async function searchCategories({
  page = 1,
  limit = 50,
  search,
  active,
  sortBy = "sortOrder",
  sortOrder = "asc",
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  sortBy?: string
  sortOrder?: string
}): Promise<{ items: Category[]; total: number; page: number; totalPages: number }> {
  const conditions: ReturnType<typeof eq>[] = []

  if (search) {
    const term = `%${search}%`
    conditions.push(
      or(
        ilike(categories.slug, term),
        sql`${categories.name}->>'es' ILIKE ${term}`,
        sql`${categories.name}->>'pt' ILIKE ${term}`,
      )!,
    )
  }
  if (active !== undefined) {
    conditions.push(eq(categories.active, active))
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined

  const orderCol = sortBy === "name" ? sql`${categories.name}->>'es'`
    : sortBy === "slug" ? categories.slug
    : sortBy === "active" ? categories.active
    : categories.sortOrder

  const dir = sortOrder === "desc" ? sql`DESC` : sql`ASC`

  const [rows, [{ total: totalCount }]] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(where)
      .orderBy(sql`${orderCol} ${dir}`)
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(categories)
      .where(where),
  ])

  return {
    items: rows.map(mapRow),
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  }
}
