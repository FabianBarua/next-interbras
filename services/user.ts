import { db } from "@/lib/db"
import { users, addresses } from "@/lib/db/schema"
import { accounts } from "@/lib/db/schema/auth-tables"
import { eq, asc } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"
import type { UserProfile, Address } from "@/types/user"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return cachedQuery(`profile:user:${userId}`, async () => {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (rows.length === 0) return null
    const u = rows[0]

    let addrRows: (typeof addresses.$inferSelect)[] = []
    try {
      addrRows = await db.select().from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(asc(addresses.createdAt))
    } catch (err) {
      console.error("[getUserProfile] Failed to fetch addresses", err)
    }

    // Check if user has OAuth account linked
    let isOAuth = false
    try {
      const acct = await db.select({ provider: accounts.provider })
        .from(accounts).where(eq(accounts.userId, userId)).limit(1)
      isOAuth = acct.length > 0
    } catch { /* accounts table may not exist yet */ }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? null,
      documentType: u.documentType ?? null,
      documentNumber: u.documentNumber ?? null,
      nationality: u.nationality ?? null,
      isOAuth,
      createdAt: u.createdAt.toISOString(),
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
    countryCode: row.countryCode,
    isDefault: row.isDefault,
  }
}
