import type { Product } from "./product"

export interface WishlistItem {
  productId: string
  product: Product
  addedAt: string
}

export interface Wishlist {
  items: WishlistItem[]
}
