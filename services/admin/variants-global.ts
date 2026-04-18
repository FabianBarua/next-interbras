import { db } from "@/lib/db"
import { variants, products, categories, externalCodes, productImages, attributes, attributeValues, variantAttributeValues } from "@/lib/db/schema"
import { eq, asc, desc, inArray, ilike, or, sql, count } from "drizzle-orm"
import { escapeLike } from "@/lib/db/multi-search"
import type { I18nText } from "@/types/common"

async function loadOptsByVariants(variantIds: string[]): Promise<Map<string, Record<string, string>>> {
  const map = new Map<string, Record<string, string>>()
  if (variantIds.length === 0) return map
  const rows = await db
    .select({
      variantId: variantAttributeValues.variantId,
      attrSlug: attributes.slug,
      valueSlug: attributeValues.slug,
    })
    .from(variantAttributeValues)
    .innerJoin(attributes, eq(attributes.id, variantAttributeValues.attributeId))
    .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
    .where(inArray(variantAttributeValues.variantId, variantIds))
  for (const r of rows) {
    const obj = map.get(r.variantId) ?? {}
    obj[r.attrSlug] = r.valueSlug
    map.set(r.variantId, obj)
  }
  return map
}

export interface AdminVariantGlobal {
  id: string
  productId: string
  productName: I18nText
  productSlug: string
  categoryName: I18nText | null
  sku: string
  options: Record<string, string>
  unitsPerBox: number | null
  active: boolean
  imageUrl: string | null
  priceUsd: string | null
  priceGs: string | null
  priceBrl: string | null
  price1: string | null
  price2: string | null
  price3: string | null
  createdAt: string
}

export async function getAllVariantsGlobal(opts?: { search?: string; categoryId?: string }): Promise<AdminVariantGlobal[]> {
  let query = db.select({
    v: variants,
    productName: products.name,
    productSlug: products.slug,
    categoryName: categories.name,
  })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.slug), asc(variants.createdAt))
    .$dynamic()

  if (opts?.categoryId) {
    query = query.where(eq(products.categoryId, opts.categoryId))
  }

  const rows = await query
  if (rows.length === 0) return []

  const variantIds = rows.map(r => r.v.id)

  // Batch load first image per variant
  const imgRows = await db.select().from(productImages)
    .where(inArray(productImages.variantId, variantIds))
    .orderBy(asc(productImages.sortOrder))

  const imgMap = new Map<string, string>()
  for (const img of imgRows) {
    if (img.variantId && !imgMap.has(img.variantId)) imgMap.set(img.variantId, img.url)
  }

  // Batch load prices from external codes
  const ecRows = await db.select().from(externalCodes)
    .where(inArray(externalCodes.variantId, variantIds))

  const priceMap = new Map<string, { code: string; priceUsd: string | null; priceGs: string | null; priceBrl: string | null; price1: string | null; price2: string | null; price3: string | null }>()
  for (const ec of ecRows) {
    if (ec.variantId && !priceMap.has(ec.variantId)) {
      priceMap.set(ec.variantId, { code: ec.code, priceUsd: ec.priceUsd, priceGs: ec.priceGs, priceBrl: ec.priceBrl, price1: ec.price1, price2: ec.price2, price3: ec.price3 })
    }
  }

  // Batch load attribute values per variant
  const optsMap = await loadOptsByVariants(variantIds)

  let result = rows.map(({ v, productName, productSlug, categoryName }) => {
    const prices = priceMap.get(v.id)
    return {
      id: v.id,
      productId: v.productId,
      productName: productName as I18nText,
      productSlug,
      categoryName: categoryName as I18nText | null,
      sku: prices?.code ?? "",
      options: optsMap.get(v.id) ?? {},
      unitsPerBox: v.unitsPerBox,
      active: v.active,
      imageUrl: imgMap.get(v.id) ?? null,
      priceUsd: prices?.priceUsd ?? null,
      priceGs: prices?.priceGs ?? null,
      priceBrl: prices?.priceBrl ?? null,
      price1: prices?.price1 ?? null,
      price2: prices?.price2 ?? null,
      price3: prices?.price3 ?? null,
      createdAt: v.createdAt.toISOString(),
    }
  })

  if (opts?.search) {
    const s = opts.search.toLowerCase()
    result = result.filter(r =>
      r.sku.toLowerCase().includes(s) ||
      (r.productName.es?.toLowerCase().includes(s)) ||
      r.productSlug.toLowerCase().includes(s) ||
      Object.values(r.options).some(v => v.toLowerCase().includes(s))
    )
  }

  return result
}

export async function searchVariantsGlobal({
  page = 1,
  limit = 50,
  search,
  categoryId,
  sortBy = "product",
  sortOrder = "asc",
}: {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  sortBy?: string
  sortOrder?: string
}): Promise<{ items: AdminVariantGlobal[]; total: number; page: number; totalPages: number }> {
  const conditions: ReturnType<typeof eq>[] = []

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId))
  }
  if (search) {
    const term = `%${escapeLike(search)}%`
    conditions.push(
      or(
        ilike(externalCodes.code, term),
        sql`${products.name}->>'es' ILIKE ${term}`,
        ilike(products.slug, term),
      )!,
    )
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined

  const baseQuery = db
    .select({ v: variants, productName: products.name, productSlug: products.slug, categoryName: categories.name })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(externalCodes, eq(externalCodes.variantId, variants.id))

  const countQuery = db
    .select({ total: count() })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(externalCodes, eq(externalCodes.variantId, variants.id))

  const dirFn = sortOrder === "desc" ? desc : asc
  const orderCols: Record<string, ReturnType<typeof asc>> = {
    sku: dirFn(externalCodes.code),
    product: dirFn(products.slug),
    category: dirFn(sql`${categories.name}->>'es'`),
    active: dirFn(variants.active),
  }
  const orderBy = orderCols[sortBy] ?? asc(products.slug)

  const [rows, [{ total: totalCount }]] = await Promise.all([
    baseQuery.where(where).orderBy(orderBy, asc(variants.createdAt)).limit(limit).offset((page - 1) * limit),
    countQuery.where(where),
  ])

  if (rows.length === 0) return { items: [], total: totalCount, page, totalPages: Math.ceil(totalCount / limit) }

  const variantIds = rows.map(r => r.v.id)

  const [imgRows, ecRows] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.variantId, variantIds)).orderBy(asc(productImages.sortOrder)),
    db.select().from(externalCodes).where(inArray(externalCodes.variantId, variantIds)),
  ])

  const imgMap = new Map<string, string>()
  for (const img of imgRows) {
    if (img.variantId && !imgMap.has(img.variantId)) imgMap.set(img.variantId, img.url)
  }

  const priceMap = new Map<string, { code: string; priceUsd: string | null; priceGs: string | null; priceBrl: string | null; price1: string | null; price2: string | null; price3: string | null }>()
  for (const ec of ecRows) {
    if (ec.variantId && !priceMap.has(ec.variantId)) {
      priceMap.set(ec.variantId, { code: ec.code, priceUsd: ec.priceUsd, priceGs: ec.priceGs, priceBrl: ec.priceBrl, price1: ec.price1, price2: ec.price2, price3: ec.price3 })
    }
  }

  const optsMap = await loadOptsByVariants(variantIds)

  const items = rows.map(({ v, productName, productSlug, categoryName }) => {
    const prices = priceMap.get(v.id)
    return {
      id: v.id,
      productId: v.productId,
      productName: productName as I18nText,
      productSlug,
      categoryName: categoryName as I18nText | null,
      sku: prices?.code ?? "",
      options: optsMap.get(v.id) ?? {},
      unitsPerBox: v.unitsPerBox,
      active: v.active,
      imageUrl: imgMap.get(v.id) ?? null,
      priceUsd: prices?.priceUsd ?? null,
      priceGs: prices?.priceGs ?? null,
      priceBrl: prices?.priceBrl ?? null,
      price1: prices?.price1 ?? null,
      price2: prices?.price2 ?? null,
      price3: prices?.price3 ?? null,
      createdAt: v.createdAt.toISOString(),
    }
  })

  return { items, total: totalCount, page, totalPages: Math.ceil(totalCount / limit) }
}
