import { db } from "@/lib/db"
import { products, categories, productImages } from "@/lib/db/schema"
import { eq, asc, desc, inArray, count, sql } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
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

  const imgs = await db.select().from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.sortOrder))

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
    images: imgs.map(i => ({
      id: i.id,
      url: i.url,
      alt: i.alt as I18nText | null,
      variantId: i.variantId,
      sortOrder: i.sortOrder,
    })),
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
  images?: string[]
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

  if (input.images?.length) {
    await db.insert(productImages).values(
      input.images.map((url, i) => ({
        productId: row.id,
        url,
        sortOrder: i,
      }))
    )
  }

  await invalidateCache("products:*", "variants:*", "categories:*")
  return row.id
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>): Promise<void> {
  const { images, ...rest } = input
  if (Object.keys(rest).length > 0) {
    await db.update(products).set(rest).where(eq(products.id, id))
  }

  if (images !== undefined) {
    // Replace all product-level images (variant images untouched)
    await db.delete(productImages).where(
      sql`${productImages.productId} = ${id} AND ${productImages.variantId} IS NULL`
    )
    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((url, i) => ({
          productId: id,
          url,
          sortOrder: i,
        }))
      )
    }
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
