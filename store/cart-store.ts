import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart } from '../types/cart'
import type { Product, Variant } from '../types/product'

interface CartState {
  cart: Cart
  lastAddedAt: number
  _hydrated: boolean
  addItem: (product: Product, quantity: number, variant?: Variant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: { items: [], totalItems: 0, subtotal: 0 },
      lastAddedAt: 0,
      _hydrated: false,
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
        return { cart: { items, totalItems, subtotal: 0 }, lastAddedAt: Date.now() }
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
    {
      name: 'interbras-cart',
      partialize: (state) => ({ cart: state.cart, lastAddedAt: state.lastAddedAt }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset stale lastAddedAt so the cart preview doesn't auto-show on page load
          if (Date.now() - state.lastAddedAt > 5000) {
            state.lastAddedAt = 0
          }
          state._hydrated = true
        }
      },
    }
  )
)
