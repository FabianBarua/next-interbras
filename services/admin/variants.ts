import { db } from "@/lib/db"
import { variants, externalCodes, productImages } from "@/lib/db/schema"
import { eq, asc, inArray, and, sql } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import { resolveVariantImageMap } from "@/lib/variant-images"
import type { I18nText } from "@/types/common"

export interface AdminVariant {
  id: string
  productId: string
  sku: string
  options: Record<string, string>
  stock: number | null
  unitsPerBox: number | null
  sortOrder: number
  active: boolean
  images: { id: string; url: string; alt: I18nText | null; sortOrder: number }[]
  externalCode: {
    id: string
    system: string
    code: string
    externalName: string | null
    priceUsd: string | null
    priceGs: string | null
    priceBrl: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export async function getAllVariantsForProduct(productId: string): Promise<AdminVariant[]> {
  const rows = await db.select().from(variants)
    .where(eq(variants.productId, productId))
    .orderBy(asc(variants.sortOrder))

  if (rows.length === 0) return []

  const variantIds = rows.map(r => r.id)

  // Load ALL images for this product (variant-specific + product-level)
  const imgRows = await db.select().from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder))

  // Separate variant-specific and product-level images
  const imgByVariant = new Map<string, AdminVariant["images"]>()
  const productLevelImgs: AdminVariant["images"] = []
  for (const img of imgRows) {
    const mapped = { id: img.id, url: img.url, alt: img.alt as I18nText | null, sortOrder: img.sortOrder }
    if (img.variantId) {
      const arr = imgByVariant.get(img.variantId) ?? []
      arr.push(mapped)
      imgByVariant.set(img.variantId, arr)
    } else {
      productLevelImgs.push(mapped)
    }
  }

  // Resolve images with sibling/product-level fallback
  const imgMap = resolveVariantImageMap(
    rows.map(r => ({ id: r.id, options: r.options as Record<string, string> })),
    imgByVariant,
    productLevelImgs,
  )

  // Load external codes
  const ecRows = await db.select().from(externalCodes)
    .where(inArray(externalCodes.variantId, variantIds))

  const ecMap = new Map<string, AdminVariant["externalCode"]>()
  for (const ec of ecRows) {
    // Take the first one per variant
    if (!ecMap.has(ec.variantId)) {
      ecMap.set(ec.variantId, {
        id: ec.id,
        system: ec.system,
        code: ec.code,
        externalName: ec.externalName,
        priceUsd: ec.priceUsd,
        priceGs: ec.priceGs,
        priceBrl: ec.priceBrl,
      })
    }
  }

  return rows.map(r => ({
    id: r.id,
    productId: r.productId,
    sku: r.sku,
    options: r.options,
    stock: r.stock,
    unitsPerBox: r.unitsPerBox,
    sortOrder: r.sortOrder,
    active: r.active,
    images: imgMap.get(r.id) ?? [],
    externalCode: ecMap.get(r.id) ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getVariantById(variantId: string): Promise<AdminVariant | null> {
  const rows = await db.select().from(variants).where(eq(variants.id, variantId)).limit(1)
  if (rows.length === 0) return null
  const r = rows[0]

  const imgRows = await db.select().from(productImages)
    .where(eq(productImages.variantId, variantId))
    .orderBy(asc(productImages.sortOrder))

  const ecRows = await db.select().from(externalCodes)
    .where(eq(externalCodes.variantId, variantId))
    .limit(1)

  const ec = ecRows[0]

  return {
    id: r.id,
    productId: r.productId,
    sku: r.sku,
    options: r.options,
    stock: r.stock,
    unitsPerBox: r.unitsPerBox,
    sortOrder: r.sortOrder,
    active: r.active,
    images: imgRows.map(img => ({ id: img.id, url: img.url, alt: img.alt as I18nText | null, sortOrder: img.sortOrder })),
    externalCode: ec ? {
      id: ec.id,
      system: ec.system,
      code: ec.code,
      externalName: ec.externalName,
      priceUsd: ec.priceUsd,
      priceGs: ec.priceGs,
      priceBrl: ec.priceBrl,
    } : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export interface CreateVariantInput {
  productId: string
  sku: string
  options: Record<string, string>
  stock?: number | null
  unitsPerBox?: number | null
  sortOrder?: number
  active?: boolean
  images?: string[]
  externalCode?: {
    system: string
    code: string
    externalName?: string
    priceUsd?: string
    priceGs?: string
    priceBrl?: string
  }
}

export async function createVariant(input: CreateVariantInput): Promise<string> {
  const [row] = await db.insert(variants).values({
    productId: input.productId,
    sku: input.sku,
    options: input.options,
    stock: input.stock ?? null,
    unitsPerBox: input.unitsPerBox ?? null,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: variants.id })

  if (input.images?.length) {
    await db.insert(productImages).values(
      input.images.map((url, i) => ({
        productId: input.productId,
        variantId: row.id,
        url,
        sortOrder: i,
      }))
    )
  }

  if (input.externalCode) {
    await db.insert(externalCodes).values({
      variantId: row.id,
      system: input.externalCode.system,
      code: input.externalCode.code,
      externalName: input.externalCode.externalName,
      priceUsd: input.externalCode.priceUsd,
      priceGs: input.externalCode.priceGs,
      priceBrl: input.externalCode.priceBrl,
    })
  }

  await invalidateCache("products:*", "variants:*")
  return row.id
}

export async function updateVariant(
  id: string,
  productId: string,
  input: Partial<Omit<CreateVariantInput, "productId">>
): Promise<void> {
  const { images, externalCode, ...rest } = input

  if (Object.keys(rest).length > 0) {
    await db.update(variants).set(rest).where(eq(variants.id, id))
  }

  if (images !== undefined) {
    // Replace all variant-level images
    await db.delete(productImages).where(
      sql`${productImages.productId} = ${productId} AND ${productImages.variantId} = ${id}`
    )
    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((url, i) => ({
          productId,
          variantId: id,
          url,
          sortOrder: i,
        }))
      )
    }
  }

  if (externalCode !== undefined) {
    // Delete existing external codes for this variant, then re-insert
    await db.delete(externalCodes).where(eq(externalCodes.variantId, id))
    if (externalCode) {
      await db.insert(externalCodes).values({
        variantId: id,
        system: externalCode.system,
        code: externalCode.code,
        externalName: externalCode.externalName,
        priceUsd: externalCode.priceUsd,
        priceGs: externalCode.priceGs,
        priceBrl: externalCode.priceBrl,
      })
    }
  }

  await invalidateCache("products:*", "variants:*")
}

export async function deleteVariant(id: string): Promise<void> {
  await db.delete(variants).where(eq(variants.id, id))
  await invalidateCache("products:*", "variants:*")
}

export async function bulkDeleteVariants(ids: string[]): Promise<number> {
  const result = await db.delete(variants).where(inArray(variants.id, ids))
  await invalidateCache("products:*", "variants:*")
  return (result as any).rowCount ?? (result as any).count ?? ids.length
}

export async function bulkUpdateVariantsActive(ids: string[], active: boolean): Promise<void> {
  await db.update(variants).set({ active }).where(inArray(variants.id, ids))
  await invalidateCache("products:*", "variants:*")
}

export async function bulkCreateVariants(inputs: CreateVariantInput[]): Promise<string[]> {
  const ids: string[] = []
  for (const input of inputs) {
    const id = await createVariant(input)
    ids.push(id)
  }
  return ids
}
