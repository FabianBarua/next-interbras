"use client"
import { useCartStore } from "@/store/cart-store"
import type { Product, Variant } from "@/types/product"
import { toast } from "sonner"
import { useState, useCallback } from "react"
import { useDictionary, useLocalePath } from "@/i18n/context"
import { CheckCircle, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

export function AddToCartButton({ product, variant, quantity = 1, className = "" }: { product: Product; variant?: Variant; quantity?: number; className?: string }) {
  const { addItem } = useCartStore()
  const { dict, locale } = useDictionary()
  const localePath = useLocalePath()
  const router = useRouter()
  const [animating, setAnimating] = useState(false)
  const outOfStock = variant?.stock === 0

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    addItem(product, quantity, variant)
    const name = product.name[locale] || product.name.es || "Producto"
    toast.custom(
      (id) => (
        <div className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
          <p className="flex-1 text-sm">
            <span className="font-medium">{name}</span>{" "}
            <span className="text-muted-foreground">{dict.products.addedToCart}</span>
          </p>
          <button
            onClick={() => {
              toast.dismiss(id)
              router.push(localePath("/carrito"))
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {dict.cart.viewCart}
          </button>
        </div>
      ),
      { duration: 4000 },
    )

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
