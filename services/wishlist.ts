import { db } from "@/lib/db"
import { wishlists, products } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"

/** Get product IDs in user's wishlist */
export async function getWishlistProductIds(userId: string): Promise<string[]> {
  return cachedQuery(`wishlist:user:${userId}`, async () => {
    const rows = await db.select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
    return rows.map(r => r.productId)
  }, 60)
}

/** Check if a specific product is in the user's wishlist */
export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const ids = await getWishlistProductIds(userId)
  return ids.includes(productId)
}

/** Toggle wishlist: add if not present, remove if present. Returns new state. */
export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const existing = await db.select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(wishlists).where(eq(wishlists.id, existing[0].id))
    await invalidateCache(`wishlist:user:${userId}`)
    return false
  } else {
    await db.insert(wishlists).values({ userId, productId }).onConflictDoNothing()
    await invalidateCache(`wishlist:user:${userId}`)
    return true
  }
}
