import { db } from "@/lib/db"
import { shippingMethods } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { ShippingMethod } from "@/types/shipping-method"
import type { I18nText } from "@/types/common"

function mapRow(row: typeof shippingMethods.$inferSelect): ShippingMethod {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: (row.description as I18nText) ?? null,
    price: Number(row.price),
    active: row.active,
    requiresAddress: row.requiresAddress,
    pickupConfig: row.pickupConfig ?? null,
    sortOrder: row.sortOrder,
  }
}

export async function getActiveShippingMethods(): Promise<ShippingMethod[]> {
  return cachedQuery("shipping-methods:active", async () => {
    const rows = await db.select().from(shippingMethods)
      .where(eq(shippingMethods.active, true))
      .orderBy(asc(shippingMethods.sortOrder))
    return rows.map(mapRow)
  }, 600)
}

export async function getAllShippingMethods(): Promise<ShippingMethod[]> {
  const rows = await db.select().from(shippingMethods)
    .orderBy(asc(shippingMethods.sortOrder))
  return rows.map(mapRow)
}

export async function getShippingMethodBySlug(slug: string): Promise<ShippingMethod | null> {
  const rows = await db.select().from(shippingMethods)
    .where(eq(shippingMethods.slug, slug)).limit(1)
  return rows[0] ? mapRow(rows[0]) : null
}

export async function createShippingMethod(input: {
  slug: string
  name: I18nText
  description?: I18nText
  price?: number
  active?: boolean
  sortOrder?: number
}): Promise<string> {
  const [row] = await db.insert(shippingMethods).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    price: String(input.price ?? 0),
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  }).returning({ id: shippingMethods.id })
  await invalidateCache("shipping-methods:*")
  return row.id
}

export async function updateShippingMethod(id: string, input: {
  slug?: string
  name?: I18nText
  description?: I18nText
  price?: number
  active?: boolean
  sortOrder?: number
}): Promise<void> {
  const values: Record<string, unknown> = { ...input }
  if (input.price !== undefined) values.price = String(input.price)
  await db.update(shippingMethods).set(values).where(eq(shippingMethods.id, id))
  await invalidateCache("shipping-methods:*")
}

export async function deleteShippingMethod(id: string): Promise<void> {
  await db.delete(shippingMethods).where(eq(shippingMethods.id, id))
  await invalidateCache("shipping-methods:*")
}
