import { db } from "@/lib/db"
import { externalCodes, variants, products, categories } from "@/lib/db/schema"
import { eq, asc, desc, sql, like, or, ilike, count, inArray } from "drizzle-orm"
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
  variantId: string | null
  variantSku: string | null
  productId: string | null
  productName: I18nText | null
  productSlug: string | null
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
    .leftJoin(variants, eq(externalCodes.variantId, variants.id))
    .leftJoin(products, eq(variants.productId, products.id))
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
    variantSku: variantSku ?? null,
    productId: productId ?? null,
    productName: (productName as I18nText) ?? null,
    productSlug: productSlug ?? null,
    categoryName: (categoryName as I18nText) ?? null,
    createdAt: ec.createdAt.toISOString(),
    updatedAt: ec.updatedAt.toISOString(),
  }))

  if (opts?.search) {
    const s = opts.search.toLowerCase()
    result = result.filter(r =>
      r.code.toLowerCase().includes(s) ||
      r.variantSku?.toLowerCase().includes(s) ||
      (r.externalName?.toLowerCase().includes(s)) ||
      (r.productName?.es?.toLowerCase().includes(s)) ||
      r.productSlug?.toLowerCase().includes(s)
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
    .leftJoin(variants, eq(externalCodes.variantId, variants.id))
    .leftJoin(products, eq(variants.productId, products.id))
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
    variantSku: variantSku ?? null,
    productId: productId ?? null,
    productName: (productName as I18nText) ?? null,
    productSlug: productSlug ?? null,
    categoryName: (categoryName as I18nText) ?? null,
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

export interface CreateExternalCodeInput {
  variantId: string
  system: string
  code: string
  externalName?: string | null
  priceUsd?: string | null
  priceGs?: string | null
  priceBrl?: string | null
}

export async function createExternalCode(input: CreateExternalCodeInput): Promise<string> {
  const [row] = await db.insert(externalCodes).values({
    variantId: input.variantId,
    system: input.system,
    code: input.code,
    externalName: input.externalName ?? null,
    priceUsd: input.priceUsd ?? null,
    priceGs: input.priceGs ?? null,
    priceBrl: input.priceBrl ?? null,
  }).returning({ id: externalCodes.id })
  await invalidateCache("products:*", "variants:*")
  return row.id
}

export async function searchExternalCodes({
  page = 1,
  limit = 50,
  search,
  system,
}: {
  page?: number
  limit?: number
  search?: string
  system?: string
}): Promise<{ items: AdminExternalCode[]; total: number; page: number; totalPages: number }> {
  const conditions: ReturnType<typeof eq>[] = []

  if (system) conditions.push(eq(externalCodes.system, system))
  if (search) {
    const term = `%${search}%`
    conditions.push(
      or(
        ilike(externalCodes.code, term),
        ilike(variants.sku, term),
        sql`${products.name}->>'es' ILIKE ${term}`,
        ilike(externalCodes.externalName, term),
      )!,
    )
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined

  const baseQuery = db.select({
    ec: externalCodes,
    variantSku: variants.sku,
    productId: products.id,
    productName: products.name,
    productSlug: products.slug,
    categoryName: categories.name,
  })
    .from(externalCodes)
    .leftJoin(variants, eq(externalCodes.variantId, variants.id))
    .leftJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))

  const countQuery = db.select({ total: count() })
    .from(externalCodes)
    .leftJoin(variants, eq(externalCodes.variantId, variants.id))
    .leftJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))

  const [rows, [{ total: totalCount }]] = await Promise.all([
    baseQuery.where(where).orderBy(desc(externalCodes.updatedAt)).limit(limit).offset((page - 1) * limit),
    countQuery.where(where),
  ])

  return {
    items: rows.map(({ ec, variantSku, productId, productName, productSlug, categoryName }) => ({
      id: ec.id,
      system: ec.system,
      code: ec.code,
      externalName: ec.externalName,
      priceUsd: ec.priceUsd,
      priceGs: ec.priceGs,
      priceBrl: ec.priceBrl,
      variantId: ec.variantId,
      variantSku: variantSku ?? null,
      productId: productId ?? null,
      productName: (productName as I18nText) ?? null,
      productSlug: productSlug ?? null,
      categoryName: (categoryName as I18nText) ?? null,
      createdAt: ec.createdAt.toISOString(),
      updatedAt: ec.updatedAt.toISOString(),
    })),
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  }
}

export async function getDistinctSystems(): Promise<string[]> {
  const rows = await db.selectDistinct({ system: externalCodes.system }).from(externalCodes).orderBy(asc(externalCodes.system))
  return rows.map(r => r.system)
}
