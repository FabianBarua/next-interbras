import type { Product, Variant } from "./product"

export interface WishlistItem {
  productId: string
  variantId: string
  product: Product
  variant: Variant
  addedAt: string
}

export interface Wishlist {
  items: WishlistItem[]
}
