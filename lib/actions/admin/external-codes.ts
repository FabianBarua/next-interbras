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
  stock: z.number().int().min(0).nullable().optional(),
})

const updateSchema = z.object({
  system: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(100).optional(),
  externalName: z.string().max(255).nullable().optional(),
  priceUsd: z.string().max(20).nullable().optional(),
  priceGs: z.string().max(20).nullable().optional(),
  priceBrl: z.string().max(20).nullable().optional(),
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

export async function searchVariantsBySkuAction(term: string) {
  await requireAdmin()
  if (!term || term.length < 1) return []
  const { db } = await import("@/lib/db")
  const { variants, products } = await import("@/lib/db/schema")
  const { ilike, eq } = await import("drizzle-orm")
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(ilike(variants.sku, `%${term}%`))
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
