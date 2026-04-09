"use server"

import { requireAuth } from "@/lib/auth/get-session"
import { toggleWishlist } from "@/services/wishlist"
import { rateLimit } from "@/lib/rate-limit"

export async function toggleWishlistAction(productId: string) {
  if (!productId || typeof productId !== "string") {
    return { error: "Invalid product ID" }
  }

  const user = await requireAuth()
  const userId = user.id

  const rl = await rateLimit(`wishlist:${userId}`, 50, 60)
  if (!rl.success) {
    return { error: "Too many requests" }
  }

  const isNowInWishlist = await toggleWishlist(userId, productId)
  return { inWishlist: isNowInWishlist }
}
