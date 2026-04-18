import { db } from "@/lib/db"
import { variants, externalCodes, productImages, attributes, attributeValues, variantAttributeValues } from "@/lib/db/schema"
import { eq, asc, inArray, sql } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"

import type { I18nText } from "@/types/common"

export interface VariantAttrValueRef {
  attributeId: string
  attributeSlug: string
  attributeName: I18nText
  valueId: string
  valueSlug: string
  valueName: I18nText
}

export interface AdminVariant {
  id: string
  productId: string
  attributeValues: VariantAttrValueRef[]
  unitsPerBox: number | null
  active: boolean
  images: { id: string; url: string; alt: I18nText | null; sortOrder: number }[]
  externalCode: {
    id: string
    system: string
    code: string
    externalName: string | null
    stock: number | null
    priceUsd: string | null
    priceGs: string | null
    priceBrl: string | null
    price1: string | null
    price2: string | null
    price3: string | null
  } | null
  createdAt: string
  updatedAt: string
}

async function loadAttrValuesByVariantIds(variantIds: string[]): Promise<Map<string, VariantAttrValueRef[]>> {
  const map = new Map<string, VariantAttrValueRef[]>()
  if (variantIds.length === 0) return map
  const rows = await db
    .select({
      variantId: variantAttributeValues.variantId,
      attributeId: attributes.id,
      attributeSlug: attributes.slug,
      attributeName: attributes.name,
      valueId: attributeValues.id,
      valueSlug: attributeValues.slug,
      valueName: attributeValues.name,
    })
    .from(variantAttributeValues)
    .innerJoin(attributes, eq(attributes.id, variantAttributeValues.attributeId))
    .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
    .where(inArray(variantAttributeValues.variantId, variantIds))
  for (const r of rows) {
    const ref: VariantAttrValueRef = {
      attributeId: r.attributeId,
      attributeSlug: r.attributeSlug,
      attributeName: r.attributeName as I18nText,
      valueId: r.valueId,
      valueSlug: r.valueSlug,
      valueName: r.valueName as I18nText,
    }
    const arr = map.get(r.variantId) ?? []
    arr.push(ref)
    map.set(r.variantId, arr)
  }
  return map
}

export async function getAllVariantsForProduct(productId: string): Promise<AdminVariant[]> {
  const rows = await db.select().from(variants)
    .where(eq(variants.productId, productId))
    .orderBy(asc(variants.createdAt))

  if (rows.length === 0) return []

  const variantIds = rows.map(r => r.id)

  const imgRows = await db.select().from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder))

  const imgMap = new Map<string, AdminVariant["images"]>()
  for (const img of imgRows) {
    if (!img.variantId) continue
    const mapped = { id: img.id, url: img.url, alt: img.alt as I18nText | null, sortOrder: img.sortOrder }
    const arr = imgMap.get(img.variantId) ?? []
    arr.push(mapped)
    imgMap.set(img.variantId, arr)
  }

  const ecRows = await db.select().from(externalCodes)
    .where(inArray(externalCodes.variantId, variantIds))

  const ecMap = new Map<string, AdminVariant["externalCode"]>()
  for (const ec of ecRows) {
    if (ec.variantId && !ecMap.has(ec.variantId)) {
      ecMap.set(ec.variantId, {
        id: ec.id,
        system: ec.system,
        code: ec.code,
        externalName: ec.externalName,
        stock: ec.stock,
        priceUsd: ec.priceUsd,
        priceGs: ec.priceGs,
        priceBrl: ec.priceBrl,
        price1: ec.price1,
        price2: ec.price2,
        price3: ec.price3,
      })
    }
  }

  const attrMap = await loadAttrValuesByVariantIds(variantIds)

  return rows.map(r => ({
    id: r.id,
    productId: r.productId,
    attributeValues: attrMap.get(r.id) ?? [],
    unitsPerBox: r.unitsPerBox,
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
  const attrMap = await loadAttrValuesByVariantIds([variantId])

  return {
    id: r.id,
    productId: r.productId,
    attributeValues: attrMap.get(r.id) ?? [],
    unitsPerBox: r.unitsPerBox,
    active: r.active,
    images: imgRows.map(img => ({ id: img.id, url: img.url, alt: img.alt as I18nText | null, sortOrder: img.sortOrder })),
    externalCode: ec ? {
      id: ec.id,
      system: ec.system,
      code: ec.code,
      externalName: ec.externalName,
      stock: ec.stock,
      priceUsd: ec.priceUsd,
      priceGs: ec.priceGs,
      priceBrl: ec.priceBrl,
      price1: ec.price1,
      price2: ec.price2,
      price3: ec.price3,
    } : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export interface CreateVariantInput {
  productId: string
  attributeValueIds: string[]
  unitsPerBox?: number | null
  active?: boolean
  images?: string[]
  externalCode?: {
    system: string
    code: string
    externalName?: string
    priceUsd?: string
    priceGs?: string
    priceBrl?: string
    price1?: string
    price2?: string
    price3?: string
    stock?: number | null
  }
}

async function insertVariantAttributeValues(
  tx: any,
  variantId: string,
  attributeValueIds: string[],
) {
  if (attributeValueIds.length === 0) return
  const valRows = await tx
    .select({ id: attributeValues.id, attributeId: attributeValues.attributeId })
    .from(attributeValues)
    .where(inArray(attributeValues.id, attributeValueIds))
  if (valRows.length !== attributeValueIds.length) {
    throw new Error("Algun attribute_value_id no existe")
  }
  const seenAttrs = new Set<string>()
  for (const v of valRows) {
    if (seenAttrs.has(v.attributeId)) {
      throw new Error("Una variante no puede tener dos valores del mismo atributo")
    }
    seenAttrs.add(v.attributeId)
  }
  await tx.insert(variantAttributeValues).values(
    valRows.map((v: { id: string; attributeId: string }) => ({
      variantId,
      attributeId: v.attributeId,
      attributeValueId: v.id,
    }))
  )
}

export async function createVariant(input: CreateVariantInput): Promise<string> {
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(variants).values({
      productId: input.productId,
      unitsPerBox: input.unitsPerBox ?? null,
      active: input.active ?? true,
    }).returning({ id: variants.id })

    await insertVariantAttributeValues(tx, row.id, input.attributeValueIds)

    if (input.images?.length) {
      await tx.insert(productImages).values(
        input.images.map((url, i) => ({
          productId: input.productId,
          variantId: row.id,
          url,
          sortOrder: i,
        }))
      )
    }

    if (input.externalCode) {
      await tx.insert(externalCodes).values({
        variantId: row.id,
        system: input.externalCode.system,
        code: input.externalCode.code,
        externalName: input.externalCode.externalName,
        stock: input.externalCode.stock ?? null,
        priceUsd: input.externalCode.priceUsd,
        priceGs: input.externalCode.priceGs,
        priceBrl: input.externalCode.priceBrl,
        price1: input.externalCode.price1,
        price2: input.externalCode.price2,
        price3: input.externalCode.price3,
      })
    }

    return row.id
  })

  await invalidateCache("products:*", "variants:*")
  return id
}

export async function updateVariant(
  id: string,
  productId: string,
  input: Partial<Omit<CreateVariantInput, "productId">>
): Promise<void> {
  const { images, externalCode, attributeValueIds, ...rest } = input

  await db.transaction(async (tx) => {
    if (Object.keys(rest).length > 0) {
      await tx.update(variants).set(rest).where(eq(variants.id, id))
    }

    if (attributeValueIds !== undefined) {
      await tx.delete(variantAttributeValues).where(eq(variantAttributeValues.variantId, id))
      await insertVariantAttributeValues(tx, id, attributeValueIds)
    }

    if (images !== undefined) {
      await tx.delete(productImages).where(
        sql`${productImages.productId} = ${productId} AND ${productImages.variantId} = ${id}`
      )
      if (images.length > 0) {
        await tx.insert(productImages).values(
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
      await tx.delete(externalCodes).where(eq(externalCodes.variantId, id))
      if (externalCode) {
        await tx.insert(externalCodes).values({
          variantId: id,
          system: externalCode.system,
          code: externalCode.code,
          externalName: externalCode.externalName,
          stock: externalCode.stock ?? null,
          priceUsd: externalCode.priceUsd,
          priceGs: externalCode.priceGs,
          priceBrl: externalCode.priceBrl,
          price1: externalCode.price1,
          price2: externalCode.price2,
          price3: externalCode.price3,
        })
      }
    }
  })

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
