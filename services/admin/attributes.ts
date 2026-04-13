import { db } from "@/lib/db"
import { attributes, attributeValues } from "@/lib/db/schema"
import { eq, asc, inArray, ilike, or, sql, count } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { I18nText } from "@/types/common"

export interface AdminAttribute {
  id: string
  slug: string
  name: I18nText
  description: I18nText | null
  sortOrder: number
  active: boolean
  valueCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminAttributeValue {
  id: string
  attributeId: string
  slug: string
  name: I18nText
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminAttributeFull extends Omit<AdminAttribute, "valueCount"> {
  values: AdminAttributeValue[]
}

export async function getAllAttributesAdmin(): Promise<AdminAttribute[]> {
  const rows = await db.select().from(attributes).orderBy(asc(attributes.sortOrder))
  if (rows.length === 0) return []

  const attrIds = rows.map(r => r.id)
  const valRows = await db.select().from(attributeValues)
    .where(inArray(attributeValues.attributeId, attrIds))

  const countMap = new Map<string, number>()
  for (const v of valRows) {
    countMap.set(v.attributeId, (countMap.get(v.attributeId) ?? 0) + 1)
  }

  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name as I18nText,
    description: (r.description as I18nText) ?? null,
    sortOrder: r.sortOrder,
    active: r.active,
    valueCount: countMap.get(r.id) ?? 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getAttributeByIdAdmin(id: string): Promise<AdminAttributeFull | null> {
  const rows = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1)
  if (rows.length === 0) return null
  const r = rows[0]

  const vals = await db.select().from(attributeValues)
    .where(eq(attributeValues.attributeId, id))
    .orderBy(asc(attributeValues.sortOrder))

  return {
    id: r.id,
    slug: r.slug,
    name: r.name as I18nText,
    description: (r.description as I18nText) ?? null,
    sortOrder: r.sortOrder,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    values: vals.map(v => ({
      id: v.id,
      attributeId: v.attributeId,
      slug: v.slug,
      name: v.name as I18nText,
      sortOrder: v.sortOrder,
      active: v.active,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
  }
}

/** Lightweight: just attributes + their values for pickers */
export async function getAttributesWithValues(): Promise<{ id: string; slug: string; name: I18nText; values: { id: string; slug: string; name: I18nText }[] }[]> {
  const attrs = await db.select().from(attributes)
    .where(eq(attributes.active, true))
    .orderBy(asc(attributes.sortOrder))
  if (attrs.length === 0) return []

  const vals = await db.select().from(attributeValues)
    .where(eq(attributeValues.active, true))
    .orderBy(asc(attributeValues.sortOrder))

  const valMap = new Map<string, { id: string; slug: string; name: I18nText }[]>()
  for (const v of vals) {
    const arr = valMap.get(v.attributeId) ?? []
    arr.push({ id: v.id, slug: v.slug, name: v.name as I18nText })
    valMap.set(v.attributeId, arr)
  }

  return attrs.map(a => ({
    id: a.id,
    slug: a.slug,
    name: a.name as I18nText,
    values: valMap.get(a.id) ?? [],
  }))
}

export interface CreateAttributeInput {
  slug: string
  name: I18nText
  description?: I18nText
  sortOrder?: number
  active?: boolean
}

export async function createAttribute(input: CreateAttributeInput): Promise<string> {
  const [row] = await db.insert(attributes).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: attributes.id })
  return row.id
}

export async function updateAttribute(id: string, input: Partial<CreateAttributeInput>): Promise<void> {
  await db.update(attributes).set(input).where(eq(attributes.id, id))
}

export async function deleteAttribute(id: string): Promise<void> {
  await db.delete(attributes).where(eq(attributes.id, id))
}

export async function bulkDeleteAttributes(ids: string[]): Promise<number> {
  let deleted = 0
  for (const id of ids) {
    try { await db.delete(attributes).where(eq(attributes.id, id)); deleted++ }
    catch { /* skip */ }
  }
  return deleted
}

// Attribute values

export interface CreateAttributeValueInput {
  attributeId: string
  slug: string
  name: I18nText
  sortOrder?: number
  active?: boolean
}

export async function createAttributeValue(input: CreateAttributeValueInput): Promise<string> {
  const [row] = await db.insert(attributeValues).values({
    attributeId: input.attributeId,
    slug: input.slug,
    name: input.name,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  }).returning({ id: attributeValues.id })
  return row.id
}

export async function updateAttributeValue(id: string, input: Partial<Omit<CreateAttributeValueInput, "attributeId">>): Promise<void> {
  await db.update(attributeValues).set(input).where(eq(attributeValues.id, id))
}

export async function deleteAttributeValue(id: string): Promise<void> {
  await db.delete(attributeValues).where(eq(attributeValues.id, id))
}

export async function bulkCreateAttributeValues(inputs: CreateAttributeValueInput[]): Promise<string[]> {
  const ids: string[] = []
  for (const input of inputs) {
    const id = await createAttributeValue(input)
    ids.push(id)
  }
  return ids
}

export async function searchAttributes({
  page = 1,
  limit = 50,
  search,
  sortBy = "sortOrder",
  sortOrder = "asc",
}: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: string
}): Promise<{ items: AdminAttribute[]; total: number; page: number; totalPages: number }> {
  const conditions: ReturnType<typeof eq>[] = []
  if (search) {
    const term = `%${search}%`
    conditions.push(
      or(
        ilike(attributes.slug, term),
        sql`${attributes.name}->>'es' ILIKE ${term}`,
        sql`${attributes.name}->>'pt' ILIKE ${term}`,
      )!,
    )
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : undefined

  const orderCol = sortBy === "name" ? sql`${attributes.name}->>'es'`
    : sortBy === "slug" ? attributes.slug
    : attributes.sortOrder
  const dir = sortOrder === "desc" ? sql`DESC` : sql`ASC`

  const [rows, [{ total: totalCount }]] = await Promise.all([
    db.select().from(attributes).where(where).orderBy(sql`${orderCol} ${dir}`).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(attributes).where(where),
  ])

  if (rows.length === 0) return { items: [], total: totalCount, page, totalPages: Math.ceil(totalCount / limit) }

  const attrIds = rows.map(r => r.id)
  const valRows = await db.select().from(attributeValues).where(inArray(attributeValues.attributeId, attrIds))
  const countMap = new Map<string, number>()
  for (const v of valRows) countMap.set(v.attributeId, (countMap.get(v.attributeId) ?? 0) + 1)

  return {
    items: rows.map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name as I18nText,
      description: (r.description as I18nText) ?? null,
      sortOrder: r.sortOrder,
      active: r.active,
      valueCount: countMap.get(r.id) ?? 0,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  }
}
