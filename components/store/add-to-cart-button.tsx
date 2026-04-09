"use client"
import { useCartStore } from "@/store/cart-store"
import type { Product, Variant } from "@/types/product"
import { toast } from "sonner"
import { useState, useCallback } from "react"
import { useDictionary } from "@/i18n/context"

export function AddToCartButton({ product, variant, quantity = 1, className = "" }: { product: Product; variant?: Variant; quantity?: number; className?: string }) {
  const { addItem } = useCartStore()
  const { dict, locale } = useDictionary()
  const [animating, setAnimating] = useState(false)
  const outOfStock = variant?.stock === 0

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem(product, quantity, variant)
    toast.success(`${product.name[locale] || product.name.es} ${dict.products.addedToCart}`)

    setAnimating(true)
    setTimeout(() => setAnimating(false), 600)
  }, [addItem, product, quantity, variant, outOfStock, locale, dict])

  return (
    <button 
      onClick={handleAddToCart}
      disabled={outOfStock}
      className={`relative px-4 py-2 w-full bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-all overflow-hidden ${animating ? "scale-95" : ""} ${outOfStock ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {animating && (
        <span className="absolute inset-0 bg-white/20 animate-[cartPulse_0.6s_ease-out]" />
      )}
      <span className="relative flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${animating ? "scale-125 -rotate-12" : ""}`}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        {animating ? dict.products.added : outOfStock ? dict.products.outOfStock : dict.products.addToCart}
      </span>
    </button>
  )
}
