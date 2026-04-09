"use client"
import { useWishlistStore } from "@/store/wishlist-store"
import { ProductCard } from "@/components/store/product-card"
import { useState, useEffect } from "react"
import Link from "@/i18n/link"
import { useDictionary } from "@/i18n/context"

export default function WishlistPage() {
  const { wishlist } = useWishlistStore()
  const [isMounted, setIsMounted] = useState(false)
  const { dict } = useDictionary()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{dict.account.wishlist}</h1>
      
      {wishlist.items.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-card space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <h2 className="text-xl font-bold">{dict.account.noWishlistTitle}</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {dict.account.noWishlistDesc}
          </p>
          <Link href="/productos" className="inline-block mt-4 px-6 py-2 border rounded-md hover:bg-accent font-medium transition-colors">
            {dict.common.viewProducts}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.items.map(item => (
             <ProductCard key={item.variantId} product={item.product} variant={item.variant} />
          ))}
        </div>
      )}
    </div>
  )
}
