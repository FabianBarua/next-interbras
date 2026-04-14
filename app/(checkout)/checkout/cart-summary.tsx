"use client"

import Image from "next/image"
import Link from "@/i18n/link"
import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { getVariantMainImage } from "@/lib/variant-images"
import { ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"

interface Props {
  shippingCost?: number | null
}

export function CartSummary({ shippingCost }: Props) {
  const { cart } = useCartStore()
  const { dict, locale } = useDictionary()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) {
    return (
      <div className="rounded-2xl bg-muted/40 p-6">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
        <div className="mt-4 space-y-3">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/40 p-6 text-center">
        <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{dict.checkout.emptyCartTitle}</p>
      </div>
    )
  }

  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.variant?.externalCode?.priceUsd || 0
    return acc + price * item.quantity
  }, 0)

  const total = subtotal + (shippingCost ?? 0)

  return (
    <div className="rounded-2xl bg-muted/40 p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {dict.checkout.orderSummary}
        </h3>
        <Link href="/carrito" className="text-xs text-primary hover:underline underline-offset-2">
          {dict.cart.viewCart}
        </Link>
      </div>

      <div className="space-y-3">
        {cart.items.map((item) => {
          const img = getVariantMainImage(item.variant)
          const name = item.product.name[locale] || item.product.name.es || "Producto"
          const price = item.variant?.externalCode?.priceUsd || 0

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-background">
                {img && (
                  <Image src={img.url} alt={name} fill className="object-contain p-1" sizes="44px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">×{item.quantity}</p>
              </div>
              <span className="text-sm tabular-nums">${(price * item.quantity).toLocaleString()}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-border/50 pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{dict.checkout.stepShipping}</span>
          <span className="tabular-nums">
            {shippingCost != null
              ? shippingCost === 0
                ? locale === "pt" ? "Grátis" : "Gratis"
                : `$${shippingCost.toLocaleString()}`
              : "—"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-border/50 pt-3">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-lg font-bold tabular-nums">${total.toLocaleString()}</span>
      </div>
    </div>
  )
}
