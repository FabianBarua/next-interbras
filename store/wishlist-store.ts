import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wishlist } from '../types/wishlist'
import type { Product, Variant } from '../types/product'

interface WishlistState {
  wishlist: Wishlist
  addItem: (product: Product, variant: Variant) => void
  removeItem: (variantId: string) => void
  toggle: (product: Product, variant: Variant) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: { items: [] },
      addItem: (product, variant) => set((state) => {
        if (state.wishlist.items.find(i => i.variantId === variant.id)) return state
        return { wishlist: { items: [...state.wishlist.items, { productId: product.id, variantId: variant.id, product, variant, addedAt: new Date().toISOString() }] } }
      }),
      removeItem: (variantId) => set((state) => ({
        wishlist: { items: state.wishlist.items.filter(i => i.variantId !== variantId) }
      })),
      toggle: (product, variant) => {
        const state = get()
        if (state.wishlist.items.find(i => i.variantId === variant.id)) {
          state.removeItem(variant.id)
        } else {
          state.addItem(product, variant)
        }
      }
    }),
    { name: 'interbras-wishlist' }
  )
)
