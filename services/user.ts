import { db } from "@/lib/db"
import { users, addresses } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { UserProfile, Address } from "@/types/user"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return cachedQuery(`profile:user:${userId}`, async () => {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (rows.length === 0) return null
    const u = rows[0]

    const addrRows = await db.select().from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(asc(addresses.createdAt))

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      addresses: addrRows.map(mapAddress),
    } satisfies UserProfile
  }, 120)
}

export async function getAddresses(userId: string): Promise<Address[]> {
  const addrRows = await db.select().from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(asc(addresses.createdAt))
  return addrRows.map(mapAddress)
}

function mapAddress(row: typeof addresses.$inferSelect): Address {
  return {
    id: row.id,
    name: row.label ?? "",
    street: row.street,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode ?? "",
    country: row.country,
    isDefault: row.isDefault,
  }
}
