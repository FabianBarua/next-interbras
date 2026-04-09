"use client"
import { useWishlistStore } from "@/store/wishlist-store"
import type { Product } from "@/types/product"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function WishlistButton({ product, className = "" }: { product: Product; className?: string }) {
  const { wishlist, toggle } = useWishlistStore()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isFav = isMounted ? wishlist.items.some(i => i.productId === product.id) : false

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(product)
    toast(isFav ? "Removido de favoritos" : "Añadido a favoritos")
  }

  return (
    <button 
      onClick={handleToggle}
      className={`p-2 rounded-full transition-colors hover:bg-accent focus:outline-none ${className}`}
      aria-label="Toggle wishlist"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill={isFav ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={isFav ? "text-red-500" : "text-muted-foreground"}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    </button>
  )
}
