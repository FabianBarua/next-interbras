import { db } from "@/lib/db"
import { countries } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import type { Country } from "@/types/country"
import type { I18nText } from "@/types/common"

function mapRow(row: typeof countries.$inferSelect): Country {
  return {
    id: row.id,
    code: row.code,
    name: row.name as I18nText,
    flag: row.flag,
    currency: row.currency,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

export async function getAllCountries(): Promise<Country[]> {
  const rows = await db.select().from(countries).orderBy(asc(countries.sortOrder))
  return rows.map(mapRow)
}

export async function getCountryById(id: string): Promise<Country | null> {
  const rows = await db.select().from(countries).where(eq(countries.id, id)).limit(1)
  return rows[0] ? mapRow(rows[0]) : null
}

export async function createCountry(input: {
  code: string
  name: I18nText
  flag: string
  currency: string
  active?: boolean
  sortOrder?: number
}): Promise<string> {
  const [row] = await db.insert(countries).values({
    code: input.code.toUpperCase(),
    name: input.name,
    flag: input.flag,
    currency: input.currency,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  }).returning({ id: countries.id })
  await invalidateCache("countries:*")
  return row.id
}

export async function updateCountry(id: string, input: {
  code?: string
  name?: I18nText
  flag?: string
  currency?: string
  active?: boolean
  sortOrder?: number
}): Promise<void> {
  const values: Record<string, unknown> = { ...input }
  if (input.code !== undefined) values.code = input.code.toUpperCase()
  await db.update(countries).set(values).where(eq(countries.id, id))
  await invalidateCache("countries:*")
}

export async function deleteCountry(id: string): Promise<void> {
  await db.delete(countries).where(eq(countries.id, id))
  await invalidateCache("countries:*")
}
