import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { cachedQuery } from "@/lib/cache"
import type { Category } from "@/types/category"

function mapCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    shortDescription: row.shortDescription ?? null,
    image: row.image ?? null,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getCategories(): Promise<Category[]> {
  return cachedQuery("categories:all", async () => {
    const rows = await db.select().from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder))
    return rows.map(mapCategory)
  }, 600)
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return cachedQuery(`category:${slug}`, async () => {
    const rows = await db.select().from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)
    return rows[0] ? mapCategory(rows[0]) : null
  }, 600)
}
