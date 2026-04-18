/**
 * Server-side data loader for the PDF catalog page.
 * Builds flat CatalogEntry rows directly from external_codes joined with
 * their variant + product + category.
 */

import "server-only"
import { db } from "@/lib/db"
import {
  externalCodes,
  variants,
  products,
  productImages,
  categories,
  attributes,
  attributeValues,
  variantAttributeValues,
} from "@/lib/db/schema"
import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { cachedQuery } from "@/lib/cache"
import type { CatalogCategory, CatalogEntry } from "./types"
import { normalizeVoltageFilter } from "./helpers"

interface CatalogDataset {
  entries: CatalogEntry[]
  categories: CatalogCategory[]
}

async function loadCatalogDataset(): Promise<CatalogDataset> {
  // 1. external_codes ⨝ variants ⨝ products (active only)
  const rows = await db
    .select({
      ec: externalCodes,
      v: variants,
      p: products,
    })
    .from(externalCodes)
    .innerJoin(variants, eq(externalCodes.variantId, variants.id))
    .innerJoin(products, eq(variants.productId, products.id))
    .where(and(eq(products.active, true), eq(variants.active, true)))
    .orderBy(sql`${products.name}->>'es' ASC`, asc(variants.createdAt))

  if (rows.length === 0) return { entries: [], categories: [] }

  const variantIds = Array.from(new Set(rows.map(r => r.v.id)))
  const categoryIds = Array.from(
    new Set(rows.map(r => r.p.categoryId).filter((x): x is string => !!x)),
  )

  // 2. Main variant image per variant
  const imgRows = variantIds.length
    ? await db
        .select({
          id: productImages.id,
          variantId: productImages.variantId,
          url: productImages.url,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .where(inArray(productImages.variantId, variantIds))
        .orderBy(asc(productImages.sortOrder))
    : []

  const mainImageByVariant = new Map<string, string>()
  for (const img of imgRows) {
    if (img.variantId && !mainImageByVariant.has(img.variantId)) {
      mainImageByVariant.set(img.variantId, img.url)
    }
  }

  // 3. Categories
  const catRows = categoryIds.length
    ? await db.select().from(categories).where(inArray(categories.id, categoryIds))
    : []

  // 3b. Attributes per variant (slug -> slug)
  const attrRows = variantIds.length
    ? await db
        .select({
          variantId: variantAttributeValues.variantId,
          attrSlug: attributes.slug,
          valueSlug: attributeValues.slug,
        })
        .from(variantAttributeValues)
        .innerJoin(attributes, eq(attributes.id, variantAttributeValues.attributeId))
        .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
        .where(inArray(variantAttributeValues.variantId, variantIds))
    : []
  const attrsByVariant = new Map<string, Record<string, string>>()
  for (const a of attrRows) {
    const obj = attrsByVariant.get(a.variantId) ?? {}
    obj[a.attrSlug] = a.valueSlug
    attrsByVariant.set(a.variantId, obj)
  }

  const catMap: CatalogCategory[] = catRows
    .map(c => ({
      id: c.id,
      slug: c.slug,
      name: (c.name as Record<string, string>) ?? {},
      description: (c.description as Record<string, string> | null) ?? null,
      shortDescription: (c.shortDescription as Record<string, string> | null) ?? null,
      svgIcon: c.svgIcon ?? null,
      svgIconMeta:
        (c.svgIconMeta as { library: string; name: string } | null) ?? null,
      sortOrder: c.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // 4. Build flat CatalogEntry list
  const entries: CatalogEntry[] = rows.map(({ ec, v, p }) => {
    const normalizedAttrs = attrsByVariant.get(v.id) ?? {}

    const rawVoltage = typeof normalizedAttrs.voltage === "string" ? normalizedAttrs.voltage : null
    const voltage = normalizeVoltageFilter(rawVoltage) ?? rawVoltage

    const qtyPerBox = v.unitsPerBox ?? null

    const promo = false

    return {
      id: ec.id,
      code: ec.code,
      externalName: ec.externalName ?? null,
      variantId: v.id,
      productId: p.id,
      categoryId: p.categoryId ?? null,
      name: (p.name as Record<string, string>) ?? {},
      imageUrl: mainImageByVariant.get(v.id) ?? null,
      sku: ec.code,
      attributes: normalizedAttrs,
      specs: (p.specs as CatalogEntry["specs"]) ?? null,
      voltage: voltage ?? null,
      qtyPerBox,
      priceUsd: ec.priceUsd ? Number(ec.priceUsd) : null,
      priceGs: ec.priceGs ? Number(ec.priceGs) : null,
      priceBrl: ec.priceBrl ? Number(ec.priceBrl) : null,
      price1: ec.price1 ? Number(ec.price1) : null,
      price2: ec.price2 ? Number(ec.price2) : null,
      price3: ec.price3 ? Number(ec.price3) : null,
      promo,
      stock: ec.stock ?? null,
    }
  })

  return { entries, categories: catMap }
}

export async function getCatalogDataset(): Promise<CatalogDataset> {
  return cachedQuery("pdf:catalog-dataset", () => loadCatalogDataset(), 300)
}
