import { db } from "@/lib/db"
import { orderStatuses } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { OrderStatusRecord } from "@/types/order-flow"
import type { I18nText } from "@/types/common"

function mapRow(row: typeof orderStatuses.$inferSelect): OrderStatusRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: (row.description as I18nText) ?? null,
    color: row.color,
    icon: row.icon,
    isFinal: row.isFinal,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  }
}

export async function getAllOrderStatuses(): Promise<OrderStatusRecord[]> {
  const rows = await db.select().from(orderStatuses).orderBy(asc(orderStatuses.sortOrder))
  return rows.map(mapRow)
}

export async function getOrderStatusBySlug(slug: string): Promise<OrderStatusRecord | null> {
  const rows = await db.select().from(orderStatuses).where(eq(orderStatuses.slug, slug)).limit(1)
  return rows[0] ? mapRow(rows[0]) : null
}

export async function createOrderStatus(input: {
  slug: string
  name: I18nText
  description?: I18nText
  color?: string
  icon?: string
  isFinal?: boolean
  sortOrder?: number
  active?: boolean
}): Promise<string> {
  const [row] = await db.insert(orderStatuses).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    color: input.color ?? "gray",
    icon: input.icon ?? "Circle",
    isFinal: input.isFinal ?? false,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: orderStatuses.id })
  await invalidateCache("order-statuses:*")
  return row.id
}

export async function updateOrderStatus(slug: string, input: {
  name?: I18nText
  description?: I18nText
  color?: string
  icon?: string
  isFinal?: boolean
  sortOrder?: number
  active?: boolean
}): Promise<void> {
  await db.update(orderStatuses).set(input).where(eq(orderStatuses.slug, slug))
  await invalidateCache("order-statuses:*")
}

export async function deleteOrderStatus(slug: string): Promise<void> {
  await db.delete(orderStatuses).where(eq(orderStatuses.slug, slug))
  await invalidateCache("order-statuses:*")
}
