import type { Product, Variant } from "./product"

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  product: Product
  variant?: Variant
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  subtotal: number
}
