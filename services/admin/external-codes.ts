import { db } from "@/lib/db"
import { externalCodes, variants, products, categories } from "@/lib/db/schema"
import { eq, asc, desc, sql, like, or, ilike, count, inArray, isNull, and } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import { escapeLike } from "@/lib/db/multi-search"
import type { I18nText } from "@/types/common"

export interface AdminExternalCode {
  id: string
  system: string
  code: string
  externalName: string | null
  priceUsd: string | null
  priceGs: string | null
  priceBrl: string | null
  price1: string | null
  price2: string | null
  price3: string | null
  stock: number | null
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

  let result = rows.map(({ ec, productId, productName, productSlug, categoryName }) => ({
    id: ec.id,
    system: ec.system,
    code: ec.code,
    externalName: ec.externalName,
    priceUsd: ec.priceUsd,
    priceGs: ec.priceGs,
    priceBrl: ec.priceBrl,
    price1: ec.price1,
    price2: ec.price2,
    price3: ec.price3,
    stock: ec.stock,
    variantId: ec.variantId,
    variantSku: ec.variantId ? ec.code : null,
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
  const { ec, productId, productName, productSlug, categoryName } = rows[0]
  return {
    id: ec.id,
    system: ec.system,
    code: ec.code,
    externalName: ec.externalName,
    priceUsd: ec.priceUsd,
    priceGs: ec.priceGs,
    priceBrl: ec.priceBrl,
    price1: ec.price1,
    price2: ec.price2,
    price3: ec.price3,
    stock: ec.stock,
    variantId: ec.variantId,
    variantSku: ec.variantId ? ec.code : null,
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
  price1?: string | null
  price2?: string | null
  price3?: string | null
  stock?: number | null
}

export async function updateExternalCode(id: string, input: UpdateExternalCodeInput): Promise<void> {
  await db.update(externalCodes).set(input).where(eq(externalCodes.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function deleteExternalCode(id: string): Promise<void> {
  await db.delete(externalCodes).where(eq(externalCodes.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function bulkUpdatePrices(updates: { id: string; priceUsd?: string; priceGs?: string; priceBrl?: string; price1?: string; price2?: string; price3?: string }[]): Promise<number> {
  let updated = 0
  for (const u of updates) {
    const set: any = {}
    if (u.priceUsd !== undefined) set.priceUsd = u.priceUsd
    if (u.priceGs !== undefined) set.priceGs = u.priceGs
    if (u.priceBrl !== undefined) set.priceBrl = u.priceBrl
    if (u.price1 !== undefined) set.price1 = u.price1
    if (u.price2 !== undefined) set.price2 = u.price2
    if (u.price3 !== undefined) set.price3 = u.price3
    if (Object.keys(set).length > 0) {
      await db.update(externalCodes).set(set).where(eq(externalCodes.id, u.id))
      updated++
    }
  }
  if (updated > 0) await invalidateCache("products:*", "variants:*")
  return updated
}

export interface CreateExternalCodeInput {
  variantId?: string | null
  system: string
  code: string
  externalName?: string | null
  priceUsd?: string | null
  priceGs?: string | null
  priceBrl?: string | null
  price1?: string | null
  price2?: string | null
  price3?: string | null
  stock?: number | null
}

export async function createExternalCode(input: CreateExternalCodeInput): Promise<string> {
  const [row] = await db.insert(externalCodes).values({
    variantId: input.variantId ?? null,
    system: input.system,
    code: input.code,
    externalName: input.externalName ?? null,
    priceUsd: input.priceUsd ?? null,
    priceGs: input.priceGs ?? null,
    priceBrl: input.priceBrl ?? null,
    price1: input.price1 ?? null,
    price2: input.price2 ?? null,
    price3: input.price3 ?? null,
    stock: input.stock ?? null,
  }).returning({ id: externalCodes.id })
  await invalidateCache("products:*", "variants:*")
  return row.id
}

export async function searchExternalCodes({
  page = 1,
  limit = 50,
  search,
  system,
  sortBy = "updatedAt",
  sortDir = "desc",
}: {
  page?: number
  limit?: number
  search?: string
  system?: string
  sortBy?: string
  sortDir?: string
}): Promise<{ items: AdminExternalCode[]; total: number; page: number; totalPages: number }> {
  const conditions: ReturnType<typeof eq>[] = []

  if (system) conditions.push(eq(externalCodes.system, system))
  if (search) {
    const term = `%${escapeLike(search)}%`
    conditions.push(
      or(
        ilike(externalCodes.code, term),
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

  const orderCol =
    sortBy === "code" ? externalCodes.code
    : sortBy === "system" ? externalCodes.system
    : sortBy === "stock" ? externalCodes.stock
    : sortBy === "priceUsd" ? externalCodes.priceUsd
    : sortBy === "priceGs" ? externalCodes.priceGs
    : sortBy === "priceBrl" ? externalCodes.priceBrl
    : sortBy === "price1" ? externalCodes.price1
    : sortBy === "price2" ? externalCodes.price2
    : sortBy === "price3" ? externalCodes.price3
    : externalCodes.updatedAt
  const direction = sortDir === "asc" ? asc : desc

  const [rows, [{ total: totalCount }]] = await Promise.all([
    baseQuery.where(where).orderBy(direction(orderCol as any)).limit(limit).offset((page - 1) * limit),
    countQuery.where(where),
  ])

  return {
    items: rows.map(({ ec, productId, productName, productSlug, categoryName }) => ({
      id: ec.id,
      system: ec.system,
      code: ec.code,
      externalName: ec.externalName,
      priceUsd: ec.priceUsd,
      priceGs: ec.priceGs,
      priceBrl: ec.priceBrl,
      price1: ec.price1,
      price2: ec.price2,
      price3: ec.price3,
      stock: ec.stock,
      variantId: ec.variantId,
      variantSku: ec.variantId ? ec.code : null,
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

export interface UnlinkedEC {
  id: string
  system: string
  code: string
  externalName: string | null
  stock: number | null
}

export async function searchUnlinkedExternalCodes(search?: string): Promise<UnlinkedEC[]> {
  const conds: any[] = [isNull(externalCodes.variantId)]
  if (search) {
    const term = `%${escapeLike(search)}%`
    conds.push(or(ilike(externalCodes.code, term), ilike(externalCodes.externalName, term))!)
  }
  const rows = await db
    .select({ id: externalCodes.id, system: externalCodes.system, code: externalCodes.code, externalName: externalCodes.externalName, stock: externalCodes.stock })
    .from(externalCodes)
    .where(and(...conds))
    .orderBy(asc(externalCodes.code))
    .limit(20)
  return rows
}

export async function linkVariant(ecId: string, variantId: string): Promise<void> {
  await db.update(externalCodes).set({ variantId }).where(eq(externalCodes.id, ecId))
  await invalidateCache("products:*", "variants:*")
}

export async function unlinkVariant(ecId: string): Promise<void> {
  await db.update(externalCodes).set({ variantId: null }).where(eq(externalCodes.id, ecId))
  await invalidateCache("products:*", "variants:*")
}
