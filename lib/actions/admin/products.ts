"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductsActive,
  quickCreateProductWithVariants,
} from "@/services/admin/products"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const specItemSchema = z.object({ label: z.string(), value: z.string() })
const i18nSpecsSchema = z.record(z.string(), z.array(specItemSchema)).optional()

const createSchema = z.object({
  categoryId: z.string().uuid(),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  specs: i18nSpecsSchema,
  review: i18nTextSchema.optional(),
  included: i18nTextSchema.optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function createProductAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    const id = await createProduct(parsed.data)
    logEvent({ category: "admin", action: "product.create", entity: "product", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear producto." }
  }
}

export async function updateProductAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", ") }
  try {
    await updateProduct(id, parsed.data)
    logEvent({ category: "admin", action: "product.update", entity: "product", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteProductAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteProduct(id)
    logEvent({ category: "admin", action: "product.delete", entity: "product", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar producto." }
  }
}

export async function bulkDeleteProductsAction(ids: unknown) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  const deleted = await bulkDeleteProducts(parsed.data)
  logEvent({ category: "admin", action: "product.bulk_delete", entity: "product", userId: session.id, meta: { count: deleted } })
  return { deleted }
}

export async function bulkToggleProductsAction(ids: unknown, active: boolean) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  await bulkUpdateProductsActive(parsed.data, active)
  logEvent({ category: "admin", action: "product.bulk_toggle", entity: "product", userId: session.id, meta: { count: parsed.data.length, active } })
  return { success: true }
}

const quickVariantSchema = z.object({
  attributeValueIds: z.array(z.string().uuid()),
  unitsPerBox: z.number().int().positive().nullable().optional(),
  code: z.string().min(1).max(150),
  system: z.string().min(1).max(50).optional(),
  externalName: z.string().max(255).optional(),
  stock: z.number().int().nonnegative().nullable().optional(),
  priceUsd: z.string().optional(),
  priceGs: z.string().optional(),
  priceBrl: z.string().optional(),
  price1: z.string().optional(),
  price2: z.string().optional(),
  price3: z.string().optional(),
  images: z.array(z.string().max(500)).max(20).optional(),
})

const quickCreateSchema = z.object({
  product: createSchema,
  variants: z.array(quickVariantSchema).min(1).max(500),
})

export async function quickCreateProductWithVariantsAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = quickCreateSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Datos inválidos: " + parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ") }
  }
  try {
    const id = await quickCreateProductWithVariants(parsed.data)
    logEvent({
      category: "admin",
      action: "product.quick_create",
      entity: "product",
      entityId: id,
      userId: session.id,
      meta: { variantCount: parsed.data.variants.length },
    })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") {
      const detail = String(err?.detail ?? err?.message ?? "")
      if (detail.includes("slug")) return { error: "El slug del producto ya existe." }
      if (detail.includes("code")) return { error: "Uno de los códigos externos ya existe en otro producto." }
      return { error: "Conflicto de unicidad: " + detail }
    }
    return { error: err?.message ?? "Error al crear producto con variantes." }
  }
}


export async function searchProductsForPickerAction(term: string) {
  await requireAdmin()
  const s = term.trim().slice(0, 100)
  if (s.length < 1) return { items: [] as { id: string; slug: string; name: string }[] }
  const { db } = await import("@/lib/db")
  const { products } = await import("@/lib/db/schema")
  const { ilike, or, sql } = await import("drizzle-orm")
  const { escapeLike } = await import("@/lib/db/multi-search")
  const term2 = `%${escapeLike(s)}%`
  const rows = await db
    .select({ id: products.id, slug: products.slug, name: products.name })
    .from(products)
    .where(
      or(
        ilike(products.slug, term2),
        sql`${products.name}->>'es' ILIKE ${term2}`,
        sql`${products.name}->>'pt' ILIKE ${term2}`,
      )!,
    )
    .limit(20)
  return {
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: ((r.name as Record<string, string>)?.es) ?? ((r.name as Record<string, string>)?.pt) ?? r.slug,
    })),
  }
}

export async function getProductLabelAction(id: string) {
  await requireAdmin()
  if (!uuidSchema.safeParse(id).success) return null
  const { db } = await import("@/lib/db")
  const { products } = await import("@/lib/db/schema")
  const { eq } = await import("drizzle-orm")
  const rows = await db.select({ id: products.id, slug: products.slug, name: products.name }).from(products).where(eq(products.id, id)).limit(1)
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: r.id,
    slug: r.slug,
    name: ((r.name as Record<string, string>)?.es) ?? ((r.name as Record<string, string>)?.pt) ?? r.slug,
  }
}