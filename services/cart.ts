import type { Cart } from "../types/cart"

// Cart is managed client-side via Zustand (cart-store.ts)
export async function getCart(): Promise<Cart> {
  return { items: [], totalItems: 0, subtotal: 0 }
}
