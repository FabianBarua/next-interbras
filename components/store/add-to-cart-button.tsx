"use client"
import { useCartStore } from "@/store/cart-store"
import type { Product, Variant } from "@/types/product"
import { toast } from "sonner"

export function AddToCartButton({ product, variant, quantity = 1, className = "" }: { product: Product; variant?: Variant; quantity?: number; className?: string }) {
  const { addItem } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, quantity, variant)
    // Usando sonner (instalado en el template shadcn)
    toast.success(`${product.name.es || product.name.pt} añadido al carrito`)
  }

  return (
    <button 
      onClick={handleAddToCart}
      className={`px-4 py-2 w-full bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors ${className}`}
    >
      Agregar al carrito
    </button>
  )
}
