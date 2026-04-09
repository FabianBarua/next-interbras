import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wishlist } from '../types/wishlist'
import type { Product } from '../types/product'

interface WishlistState {
  wishlist: Wishlist
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  toggle: (product: Product) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: { items: [] },
      addItem: (product) => set((state) => {
        if (state.wishlist.items.find(i => i.productId === product.id)) return state
        return { wishlist: { items: [...state.wishlist.items, { productId: product.id, product, addedAt: new Date().toISOString() }] } }
      }),
      removeItem: (productId) => set((state) => ({
        wishlist: { items: state.wishlist.items.filter(i => i.productId !== productId) }
      })),
      toggle: (product) => {
        const state = get()
        if (state.wishlist.items.find(i => i.productId === product.id)) {
          state.removeItem(product.id)
        } else {
          state.addItem(product)
        }
      }
    }),
    { name: 'interbras-wishlist' }
  )
)
