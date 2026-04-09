import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart } from '../types/cart'
import type { Product, Variant } from '../types/product'

interface CartState {
  cart: Cart
  addItem: (product: Product, quantity: number, variant?: Variant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: { items: [], totalItems: 0, subtotal: 0 },
      addItem: (product, quantity, variant) => set((state) => {
        const items = [...state.cart.items]
        const existing = items.find(i => i.productId === product.id && i.variantId === variant?.id)
        if (existing) {
          existing.quantity += quantity
        } else {
          items.push({
            id: Math.random().toString(),
            productId: product.id,
            variantId: variant?.id,
            quantity,
            product,
            variant
          })
        }
        const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)
        return { cart: { items, totalItems, subtotal: 0 } }
      }),
      removeItem: (itemId) => set((state) => {
        const items = state.cart.items.filter(i => i.id !== itemId)
        const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)
        return { cart: { items, totalItems, subtotal: 0 } }
      }),
      updateQuantity: (itemId, quantity) => set((state) => {
        const items = state.cart.items.map(i => i.id === itemId ? { ...i, quantity } : i)
        const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)
        return { cart: { items, totalItems, subtotal: 0 } }
      }),
      clear: () => set({ cart: { items: [], totalItems: 0, subtotal: 0 } })
    }),
    { name: 'interbras-cart' }
  )
)
