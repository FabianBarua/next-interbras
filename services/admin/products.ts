import { db } from "@/lib/db"
import { products, categories, productImages } from "@/lib/db/schema"
import { eq, asc, desc, inArray, count, ilike, or, sql, and } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import { escapeLike } from "@/lib/db/multi-search"
import type { I18nText, I18nRichText, I18nSpecs } from "@/types/common"

export interface AdminProduct {
  id: string
  categoryId: string
  categoryName: I18nText | null
  slug: string
  name: I18nText
  description: I18nRichText | null
  specs: I18nSpecs | null
  review: I18nRichText | null
  included: I18nRichText | null
  sortOrder: number
  active: boolean
  imageUrl: string | null
  variantCount: number
  createdAt: string
  updatedAt: string
}

export async function searchProductsAdmin(opts?: {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  active?: boolean
  sortBy?: string
  sortDir?: string
}): Promise<{ items: AdminProduct[]; total: number; page: number; totalPages: number }> {
  const page = opts?.page ?? 1
  const limit = opts?.limit ?? 50

  const conditions: ReturnType<typeof eq>[] = []
  if (opts?.search) {
    const term = `%${escapeLike(opts.search)}%`
    conditions.push(
      or(
        ilike(products.slug, term),
        sql`${products.name}->>'es' ILIKE ${term}`,
        sql`${products.name}->>'pt' ILIKE ${term}`,
      )!,
    )
  }
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId))
  if (opts?.active !== undefined) conditions.push(eq(products.active, opts.active))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const orderCol =
    opts?.sortBy === "name" ? sql`${products.name}->>'es'`
    : opts?.sortBy === "slug" ? products.slug
    : opts?.sortBy === "active" ? products.active
    : opts?.sortBy === "createdAt" ? products.createdAt
    : products.sortOrder
  const dir = opts?.sortDir === "desc" ? sql`DESC` : sql`ASC`

  const [rows, [{ total: totalCount }]] = await Promise.all([
    db
      .select({ p: products, catName: categories.name })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(sql`${orderCol} ${dir}`)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(products).where(where),
  ])

  if (rows.length === 0)
    return { items: [], total: Number(totalCount), page, totalPages: Math.ceil(Number(totalCount) / limit) }

  const productIds = rows.map((r) => r.p.id)
  const { variants } = await import("@/lib/db/schema")

  const [imgRows, vcRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select({ productId: variants.productId, count: count() })
      .from(variants)
      .where(inArray(variants.productId, productIds))
      .groupBy(variants.productId),
  ])

  const firstImg = new Map<string, string>()
  for (const img of imgRows) {
    if (!firstImg.has(img.productId)) firstImg.set(img.productId, img.url)
  }
  const variantCounts = new Map<string, number>()
  for (const r of vcRows) variantCounts.set(r.productId, r.count)

  return {
    items: rows.map(({ p, catName }) => ({
      id: p.id,
      categoryId: p.categoryId,
      categoryName: catName as I18nText | null,
      slug: p.slug,
      name: p.name as I18nText,
      description: (p.description as I18nRichText) ?? null,
      specs: (p.specs as I18nSpecs) ?? null,
      review: (p.review as I18nRichText) ?? null,
      included: (p.included as I18nRichText) ?? null,
      sortOrder: p.sortOrder,
      active: p.active,
      imageUrl: firstImg.get(p.id) ?? null,
      variantCount: variantCounts.get(p.id) ?? 0,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total: Number(totalCount),
    page,
    totalPages: Math.ceil(Number(totalCount) / limit),
  }
}

export async function getAllProductsAdmin(): Promise<AdminProduct[]> {
  const rows = await db.select({
    p: products,
    catName: categories.name,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.sortOrder))

  if (rows.length === 0) return []

  const productIds = rows.map(r => r.p.id)

  // Get first image per product
  const imgRows = await db.select().from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder))

  const firstImg = new Map<string, string>()
  for (const img of imgRows) {
    if (!firstImg.has(img.productId)) firstImg.set(img.productId, img.url)
  }

  // Get variant counts
  const { variants } = await import("@/lib/db/schema")
  const vcRows = await db.select({
    productId: variants.productId,
    count: count(),
  }).from(variants)
    .where(inArray(variants.productId, productIds))
    .groupBy(variants.productId)

  const variantCounts = new Map<string, number>()
  for (const r of vcRows) variantCounts.set(r.productId, r.count)

  return rows.map(({ p, catName }) => ({
    id: p.id,
    categoryId: p.categoryId,
    categoryName: catName as I18nText | null,
    slug: p.slug,
    name: p.name as I18nText,
    description: (p.description as I18nRichText) ?? null,
    specs: (p.specs as I18nSpecs) ?? null,
    review: (p.review as I18nRichText) ?? null,
    included: (p.included as I18nRichText) ?? null,
    sortOrder: p.sortOrder,
    active: p.active,
    imageUrl: firstImg.get(p.id) ?? null,
    variantCount: variantCounts.get(p.id) ?? 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function getProductByIdAdmin(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (rows.length === 0) return null
  const p = rows[0]

  return {
    id: p.id,
    categoryId: p.categoryId,
    slug: p.slug,
    name: p.name as I18nText,
    description: (p.description as I18nRichText) ?? null,
    specs: (p.specs as I18nSpecs) ?? null,
    review: (p.review as I18nRichText) ?? null,
    included: (p.included as I18nRichText) ?? null,
    sortOrder: p.sortOrder,
    active: p.active,
  }
}

export interface CreateProductInput {
  categoryId: string
  slug: string
  name: I18nText
  description?: I18nRichText
  specs?: I18nSpecs
  review?: I18nRichText
  included?: I18nRichText
  sortOrder?: number
  active?: boolean
}

export async function createProduct(input: CreateProductInput): Promise<string> {
  const [row] = await db.insert(products).values({
    categoryId: input.categoryId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    specs: input.specs,
    review: input.review,
    included: input.included,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: products.id })

  await invalidateCache("products:*", "variants:*", "categories:*")
  return row.id
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<void> {
  if (Object.keys(input).length > 0) {
    await db.update(products).set(input).where(eq(products.id, id))
  }

  await invalidateCache("products:*", "variants:*")
}

export async function deleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function bulkDeleteProducts(ids: string[]): Promise<number> {
  const result = await db.delete(products).where(inArray(products.id, ids))
  await invalidateCache("products:*", "variants:*")
  return (result as any).rowCount ?? (result as any).count ?? ids.length
}

export async function bulkUpdateProductsActive(ids: string[], active: boolean): Promise<void> {
  await db.update(products).set({ active }).where(inArray(products.id, ids))
  await invalidateCache("products:*", "variants:*")
}
