import { db } from "@/lib/db"
import { variants, products, categories, externalCodes, productImages } from "@/lib/db/schema"
import { eq, asc, desc, inArray } from "drizzle-orm"
import type { I18nText } from "@/types/common"

export interface AdminVariantGlobal {
  id: string
  productId: string
  productName: I18nText
  productSlug: string
  categoryName: I18nText | null
  sku: string
  options: Record<string, string>
  stock: number | null
  unitsPerBox: number | null
  sortOrder: number
  active: boolean
  imageUrl: string | null
  priceUsd: string | null
  priceGs: string | null
  priceBrl: string | null
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
    .orderBy(asc(products.slug), asc(variants.sortOrder))
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

  const priceMap = new Map<string, { priceUsd: string | null; priceGs: string | null; priceBrl: string | null }>()
  for (const ec of ecRows) {
    if (!priceMap.has(ec.variantId)) {
      priceMap.set(ec.variantId, { priceUsd: ec.priceUsd, priceGs: ec.priceGs, priceBrl: ec.priceBrl })
    }
  }

  let result = rows.map(({ v, productName, productSlug, categoryName }) => {
    const prices = priceMap.get(v.id)
    return {
      id: v.id,
      productId: v.productId,
      productName: productName as I18nText,
      productSlug,
      categoryName: categoryName as I18nText | null,
      sku: v.sku,
      options: v.options,
      stock: v.stock,
      unitsPerBox: v.unitsPerBox,
      sortOrder: v.sortOrder,
      active: v.active,
      imageUrl: imgMap.get(v.id) ?? null,
      priceUsd: prices?.priceUsd ?? null,
      priceGs: prices?.priceGs ?? null,
      priceBrl: prices?.priceBrl ?? null,
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
