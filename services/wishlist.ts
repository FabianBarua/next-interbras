import { wishlistMock } from "../mock/wishlist"
import type { Wishlist } from "../types/wishlist"

const DELAY = 300

export async function getWishlist(): Promise<Wishlist> {
  return new Promise((resolve) => setTimeout(() => resolve(wishlistMock), DELAY))
}
