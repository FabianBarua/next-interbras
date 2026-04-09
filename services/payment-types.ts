import { db } from "@/lib/db"
import { paymentTypes } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { PaymentType } from "@/types/payment-type"
import type { I18nText } from "@/types/common"

function mapRow(row: typeof paymentTypes.$inferSelect): PaymentType {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: (row.description as I18nText) ?? null,
    icon: row.icon,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

export async function getActivePaymentTypes(): Promise<PaymentType[]> {
  return cachedQuery("payment-types:active", async () => {
    const rows = await db.select().from(paymentTypes)
      .where(eq(paymentTypes.active, true))
      .orderBy(asc(paymentTypes.sortOrder))
    return rows.map(mapRow)
  }, 600)
}

export async function getAllPaymentTypes(): Promise<PaymentType[]> {
  const rows = await db.select().from(paymentTypes)
    .orderBy(asc(paymentTypes.sortOrder))
  return rows.map(mapRow)
}

export async function getPaymentTypeBySlug(slug: string): Promise<PaymentType | null> {
  const rows = await db.select().from(paymentTypes)
    .where(eq(paymentTypes.slug, slug)).limit(1)
  return rows[0] ? mapRow(rows[0]) : null
}

export async function createPaymentType(input: {
  slug: string
  name: I18nText
  description?: I18nText
  icon?: string
  active?: boolean
  sortOrder?: number
}): Promise<string> {
  const [row] = await db.insert(paymentTypes).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    icon: input.icon ?? "cash",
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  }).returning({ id: paymentTypes.id })
  await invalidateCache("payment-types:*")
  return row.id
}

export async function updatePaymentType(id: string, input: {
  slug?: string
  name?: I18nText
  description?: I18nText
  icon?: string
  active?: boolean
  sortOrder?: number
}): Promise<void> {
  await db.update(paymentTypes).set(input).where(eq(paymentTypes.id, id))
  await invalidateCache("payment-types:*")
}

export async function deletePaymentType(id: string): Promise<void> {
  await db.delete(paymentTypes).where(eq(paymentTypes.id, id))
  await invalidateCache("payment-types:*")
}
