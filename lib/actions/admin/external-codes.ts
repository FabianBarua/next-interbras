"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createExternalCode,
  updateExternalCode,
  deleteExternalCode,
  bulkUpdatePrices,
  linkVariant,
  unlinkVariant,
  searchUnlinkedExternalCodes,
} from "@/services/admin/external-codes"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

const createSchema = z.object({
  variantId: z.string().uuid().nullable().optional(),
  system: z.string().min(1).max(50),
  code: z.string().min(1).max(100),
  externalName: z.string().max(255).nullable().optional(),
  priceUsd: z.string().max(20).nullable().optional(),
  priceGs: z.string().max(20).nullable().optional(),
  priceBrl: z.string().max(20).nullable().optional(),
  price1: z.string().max(20).nullable().optional(),
  price2: z.string().max(20).nullable().optional(),
  price3: z.string().max(20).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
})

const updateSchema = z.object({
  system: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(100).optional(),
  externalName: z.string().max(255).nullable().optional(),
  priceUsd: z.string().max(20).nullable().optional(),
  priceGs: z.string().max(20).nullable().optional(),
  priceBrl: z.string().max(20).nullable().optional(),
  price1: z.string().max(20).nullable().optional(),
  price2: z.string().max(20).nullable().optional(),
  price3: z.string().max(20).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
})

export async function createExternalCodeAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const id = await createExternalCode(parsed.data)
    logEvent({ category: "admin", action: "external_code.create", entity: "external_code", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código ya existe para ese sistema." }
    return { error: "Error al crear código externo." }
  }
}

export async function updateExternalCodeAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateExternalCode(id, parsed.data)
    logEvent({ category: "admin", action: "external_code.update", entity: "external_code", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteExternalCodeAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteExternalCode(id)
    logEvent({ category: "admin", action: "external_code.delete", entity: "external_code", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar." }
  }
}

export async function bulkDeleteExternalCodesAction(ids: string[]) {
  const session = await requireAdmin()
  if (ids.length > 200) return { error: "Máximo 200 items por operación." }
  for (const id of ids) {
    const parsed = uuidSchema.safeParse(id)
    if (!parsed.success) continue
    await deleteExternalCode(id)
    logEvent({ category: "admin", action: "external_code.delete", entity: "external_code", entityId: id, userId: session.id })
  }
  return { success: true }
}

export async function searchVariantsBySkuAction(term: string) {
  await requireAdmin()
  if (!term || term.length < 1) return []
  const { db } = await import("@/lib/db")
  const { variants, products, externalCodes } = await import("@/lib/db/schema")
  const { ilike, eq } = await import("drizzle-orm")
  const { escapeLike } = await import("@/lib/db/multi-search")
  const rows = await db
    .select({
      id: variants.id,
      sku: externalCodes.code,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .innerJoin(externalCodes, eq(externalCodes.variantId, variants.id))
    .where(ilike(externalCodes.code, `%${escapeLike(term)}%`))
    .limit(20)
  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    productName: (r.productName as Record<string, string>)?.es ?? "",
  }))
}

const bulkPriceSchema = z.array(z.object({
  id: z.string().uuid(),
  priceUsd: z.string().max(20).optional(),
  priceGs: z.string().max(20).optional(),
  priceBrl: z.string().max(20).optional(),
  price1: z.string().max(20).optional(),
  price2: z.string().max(20).optional(),
  price3: z.string().max(20).optional(),
})).min(1).max(200)

export async function bulkUpdatePricesAction(data: unknown) {
  await requireAdmin()
  const parsed = bulkPriceSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const updated = await bulkUpdatePrices(parsed.data)
    return { updated }
  } catch {
    return { error: "Error al actualizar precios." }
  }
}

export async function searchUnlinkedECsAction(search: string) {
  await requireAdmin()
  const s = search.trim().slice(0, 100)
  const items = await searchUnlinkedExternalCodes(s || undefined)
  return { items }
}

export async function linkVariantAction(ecId: string, variantId: string) {
  const session = await requireAdmin()
  const ecParsed = uuidSchema.safeParse(ecId)
  const varParsed = uuidSchema.safeParse(variantId)
  if (!ecParsed.success || !varParsed.success) return { error: "ID inválido." }
  try {
    await linkVariant(ecId, variantId)
    logEvent({ category: "admin", action: "external_code.link_variant", entity: "external_code", entityId: ecId, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "Esa variante ya está vinculada a otro código externo." }
    return { error: "Error al vincular variante." }
  }
}

export async function unlinkVariantAction(ecId: string) {
  const session = await requireAdmin()
  const ecParsed = uuidSchema.safeParse(ecId)
  if (!ecParsed.success) return { error: "ID inválido." }
  try {
    await unlinkVariant(ecId)
    logEvent({ category: "admin", action: "external_code.unlink_variant", entity: "external_code", entityId: ecId, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al desvincular variante." }
  }
}

/* ------------------------------------------------------------------ */
/*  Fast-assign: search available variants + bulk link                 */
/* ------------------------------------------------------------------ */

export async function searchAvailableVariantsAction(term: string) {
  await requireAdmin()
  if (!term || term.trim().length < 1) return []
  const { db } = await import("@/lib/db")
  const { variants, products, externalCodes, attributes, attributeValues, variantAttributeValues } = await import("@/lib/db/schema")
  const { eq, isNull, and, sql, inArray } = await import("drizzle-orm")
  const { multiSearch } = await import("@/lib/db/multi-search")

  const searchCond = multiSearch(term, [
    sql`${products.name}->>'es'`,
    sql`${products.name}->>'pt'`,
  ])
  if (!searchCond) return []

  const rows = await db
    .select({
      id: variants.id,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .leftJoin(externalCodes, eq(externalCodes.variantId, variants.id))
    .where(and(searchCond, isNull(externalCodes.id)))
    .limit(20)

  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const attrRows = await db
    .select({
      variantId: variantAttributeValues.variantId,
      attrSlug: attributes.slug,
      valueSlug: attributeValues.slug,
    })
    .from(variantAttributeValues)
    .innerJoin(attributes, eq(attributes.id, variantAttributeValues.attributeId))
    .innerJoin(attributeValues, eq(attributeValues.id, variantAttributeValues.attributeValueId))
    .where(inArray(variantAttributeValues.variantId, ids))

  const optsByVariant = new Map<string, Record<string, string>>()
  for (const a of attrRows) {
    const obj = optsByVariant.get(a.variantId) ?? {}
    obj[a.attrSlug] = a.valueSlug
    optsByVariant.set(a.variantId, obj)
  }

  return rows.map((r) => ({
    id: r.id,
    sku: "",
    productName: (r.productName as Record<string, string>)?.es ?? "",
    options: optsByVariant.get(r.id) ?? {},
  }))
}

const bulkLinkSchema = z.array(z.object({
  ecId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
})).min(1).max(500)

export async function bulkLinkVariantsAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = bulkLinkSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  const results: { ecId: string; ok: boolean; error?: string }[] = []
  for (const { ecId, variantId } of parsed.data) {
    try {
      if (variantId) {
        await linkVariant(ecId, variantId)
        logEvent({ category: "admin", action: "external_code.link_variant", entity: "external_code", entityId: ecId, userId: session.id })
      } else {
        await unlinkVariant(ecId)
        logEvent({ category: "admin", action: "external_code.unlink_variant", entity: "external_code", entityId: ecId, userId: session.id })
      }
      results.push({ ecId, ok: true })
    } catch (err: any) {
      results.push({
        ecId,
        ok: false,
        error: err?.code === "23505" ? "Variante ya vinculada" : "Error",
      })
    }
  }
  return { results }
}
