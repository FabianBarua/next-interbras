import { db } from "@/lib/db"
import { externalCodes, variants, products, categories } from "@/lib/db/schema"
import { eq, asc, desc, sql, like, or } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { I18nText } from "@/types/common"

export interface AdminExternalCode {
  id: string
  system: string
  code: string
  externalName: string | null
  priceUsd: string | null
  priceGs: string | null
  priceBrl: string | null
  variantId: string
  variantSku: string
  productId: string
  productName: I18nText
  productSlug: string
  categoryName: I18nText | null
  createdAt: string
  updatedAt: string
}

export async function getAllExternalCodesAdmin(opts?: { search?: string; system?: string }): Promise<AdminExternalCode[]> {
  let query = db.select({
    ec: externalCodes,
    variantSku: variants.sku,
    productId: products.id,
    productName: products.name,
    productSlug: products.slug,
    categoryName: categories.name,
  })
    .from(externalCodes)
    .innerJoin(variants, eq(externalCodes.variantId, variants.id))
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(externalCodes.updatedAt))
    .$dynamic()

  if (opts?.system) {
    query = query.where(eq(externalCodes.system, opts.system))
  }

  const rows = await query

  let result = rows.map(({ ec, variantSku, productId, productName, productSlug, categoryName }) => ({
    id: ec.id,
    system: ec.system,
    code: ec.code,
    externalName: ec.externalName,
    priceUsd: ec.priceUsd,
    priceGs: ec.priceGs,
    priceBrl: ec.priceBrl,
    variantId: ec.variantId,
    variantSku,
    productId,
    productName: productName as I18nText,
    productSlug,
    categoryName: categoryName as I18nText | null,
    createdAt: ec.createdAt.toISOString(),
    updatedAt: ec.updatedAt.toISOString(),
  }))

  if (opts?.search) {
    const s = opts.search.toLowerCase()
    result = result.filter(r =>
      r.code.toLowerCase().includes(s) ||
      r.variantSku.toLowerCase().includes(s) ||
      (r.externalName?.toLowerCase().includes(s)) ||
      (r.productName.es?.toLowerCase().includes(s)) ||
      r.productSlug.toLowerCase().includes(s)
    )
  }

  return result
}

export async function getExternalCodeByIdAdmin(id: string): Promise<AdminExternalCode | null> {
  const rows = await db.select({
    ec: externalCodes,
    variantSku: variants.sku,
    productId: products.id,
    productName: products.name,
    productSlug: products.slug,
    categoryName: categories.name,
  })
    .from(externalCodes)
    .innerJoin(variants, eq(externalCodes.variantId, variants.id))
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(externalCodes.id, id))
    .limit(1)

  if (rows.length === 0) return null
  const { ec, variantSku, productId, productName, productSlug, categoryName } = rows[0]
  return {
    id: ec.id,
    system: ec.system,
    code: ec.code,
    externalName: ec.externalName,
    priceUsd: ec.priceUsd,
    priceGs: ec.priceGs,
    priceBrl: ec.priceBrl,
    variantId: ec.variantId,
    variantSku,
    productId,
    productName: productName as I18nText,
    productSlug,
    categoryName: categoryName as I18nText | null,
    createdAt: ec.createdAt.toISOString(),
    updatedAt: ec.updatedAt.toISOString(),
  }
}

export interface UpdateExternalCodeInput {
  system?: string
  code?: string
  externalName?: string | null
  priceUsd?: string | null
  priceGs?: string | null
  priceBrl?: string | null
}

export async function updateExternalCode(id: string, input: UpdateExternalCodeInput): Promise<void> {
  await db.update(externalCodes).set(input).where(eq(externalCodes.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function deleteExternalCode(id: string): Promise<void> {
  await db.delete(externalCodes).where(eq(externalCodes.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function bulkUpdatePrices(updates: { id: string; priceUsd?: string; priceGs?: string; priceBrl?: string }[]): Promise<number> {
  let updated = 0
  for (const u of updates) {
    const set: any = {}
    if (u.priceUsd !== undefined) set.priceUsd = u.priceUsd
    if (u.priceGs !== undefined) set.priceGs = u.priceGs
    if (u.priceBrl !== undefined) set.priceBrl = u.priceBrl
    if (Object.keys(set).length > 0) {
      await db.update(externalCodes).set(set).where(eq(externalCodes.id, u.id))
      updated++
    }
  }
  if (updated > 0) await invalidateCache("products:*", "variants:*")
  return updated
}
