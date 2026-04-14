"use client"

import Image from "next/image"
import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { getVariantMainImage } from "@/lib/variant-images"
import { ChevronDown, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function MobileCartSummary() {
  const { cart } = useCartStore()
  const { dict, locale } = useDictionary()
  const [hydrated, setHydrated] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) {
    return <div className="h-14 animate-pulse rounded-xl bg-muted/40" />
  }

  if (cart.items.length === 0) return null

  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.variant?.externalCode?.priceUsd || 0
    return acc + price * item.quantity
  }, 0)

  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="rounded-xl border bg-muted/40">
      {/* Teaser bar — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {dict.checkout.orderSummary} ({itemCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums">${subtotal.toLocaleString()}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          {cart.items.map((item) => {
            const img = getVariantMainImage(item.variant)
            const name = item.product.name[locale] || item.product.name.es || "Producto"
            const price = item.variant?.externalCode?.priceUsd || 0
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background">
                  {img && <Image src={img.url} alt={name} fill className="object-contain p-1" sizes="40px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                </div>
                <span className="text-sm tabular-nums">${(price * item.quantity).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
