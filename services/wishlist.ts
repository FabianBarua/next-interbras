import { db } from "@/lib/db"
import { wishlists } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { cachedQuery, invalidateCache } from "@/lib/cache"

/** Get variant IDs in user's wishlist */
export async function getWishlistVariantIds(userId: string): Promise<string[]> {
  return cachedQuery(`wishlist:user:${userId}`, async () => {
    const rows = await db.select({ variantId: wishlists.variantId })
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
    return rows.map(r => r.variantId)
  }, 60)
}

/** Check if a specific variant is in the user's wishlist */
export async function isInWishlist(userId: string, variantId: string): Promise<boolean> {
  const ids = await getWishlistVariantIds(userId)
  return ids.includes(variantId)
}

/** Toggle wishlist: add if not present, remove if present. Returns new state. */
export async function toggleWishlist(userId: string, productId: string, variantId: string): Promise<boolean> {
  const existing = await db.select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.variantId, variantId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(wishlists).where(eq(wishlists.id, existing[0].id))
    await invalidateCache(`wishlist:user:${userId}`)
    return false
  } else {
    await db.insert(wishlists).values({ userId, productId, variantId }).onConflictDoNothing()
    await invalidateCache(`wishlist:user:${userId}`)
    return true
  }
}
