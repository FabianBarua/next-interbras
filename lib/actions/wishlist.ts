"use server"

import { requireAuth } from "@/lib/auth/get-session"
import { toggleWishlist } from "@/services/wishlist"

export async function toggleWishlistAction(productId: string) {
  if (!productId || typeof productId !== "string") {
    return { error: "Invalid product ID" }
  }

  const user = await requireAuth()
  const userId = user.id

  const isNowInWishlist = await toggleWishlist(userId, productId)
  return { inWishlist: isNowInWishlist }
}
