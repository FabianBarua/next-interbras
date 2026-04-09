"use client"

import Link from "@/i18n/link"
import Image from "next/image"
import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { QuantitySelector } from "@/components/store/quantity-selector"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { cart, removeItem, clear } = useCartStore()
  const { dict, locale } = useDictionary()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.variant?.externalCode?.priceUsd || 0) * item.quantity,
    0
  )
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 })

  return (
    <div className="container max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: dict.cart.title }]} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {dict.cart.shoppingCart}
        </h1>
        {cart.items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
          >
            {dict.cart.clearCart}
          </button>
        )}
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-card">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">{dict.cart.emptyTitle}</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {dict.cart.emptyDesc}
          </p>
          <Link
            href="/productos"
            className="inline-flex h-11 items-center px-8 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            {dict.common.viewProducts}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Items */}
          <div className="space-y-0">
            {cart.items.map((item, idx) => {
              const img = item.product.images.find((i) => i.isMain) || item.product.images[0]
              const name = item.product.name[locale] || item.product.name.es || "Producto"
              const variantName = item.variant?.name?.[locale] || item.variant?.name?.es
              const priceUsd = item.variant?.externalCode?.priceUsd || 0
              const itemTotal = priceUsd * item.quantity
              const catSlug = item.product.category?.slug || "cat"

              return (
                <div key={item.id}>
                  <div className="flex gap-4 py-5">
                    {/* Image */}
                    <Link
                      href={`/productos/${catSlug}/${item.product.slug}`}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 bg-muted/20 rounded-xl overflow-hidden shrink-0 border hover:border-primary/30 transition-colors"
                    >
                      {img && (
                        <Image src={img.url} alt={name} fill className="object-contain p-2" />
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/productos/${catSlug}/${item.product.slug}`}
                            className="font-medium text-sm sm:text-base hover:text-primary transition-colors line-clamp-2"
                          >
                            {name}
                          </Link>
                          {variantName && (
                            <Badge variant="secondary" className="mt-1.5 text-[10px] font-normal">
                              {variantName}
                            </Badge>
                          )}
                        </div>
                        <button
                          title={dict.common.remove}
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-md opacity-40 hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>

                      <div className="mt-auto pt-3 flex items-end justify-between gap-4">
                        <QuantitySelector itemId={item.id} initialQuantity={item.quantity} />
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            US$ {fmt(priceUsd)} c/u
                          </p>
                          <p className="text-base font-bold">
                            US$ {fmt(itemTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {idx < cart.items.length - 1 && <Separator />}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border bg-card p-6 space-y-5">
              <h2 className="font-bold text-lg tracking-tight">{dict.cart.summary}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {dict.common.subtotal} ({cart.totalItems} {cart.totalItems === 1 ? dict.common.product : dict.common.products})
                  </span>
                  <span className="font-medium">US$ {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.common.shipping}</span>
                  <span className="text-xs font-medium text-muted-foreground">{dict.cart.toCalculate}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-bold">{dict.cart.estimatedTotal}</span>
                <span className="text-xl font-black text-primary">US$ {fmt(subtotal)}</span>
              </div>

              <Link
                href="/checkout"
                className="flex w-full items-center justify-center h-12 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                {dict.cart.proceedCheckout}
              </Link>

              <Link
                href="/productos"
                className="flex w-full items-center justify-center h-10 text-sm font-medium border rounded-lg hover:bg-muted transition-colors"
              >
                {dict.common.continueShopping}
              </Link>

              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {dict.common.securePayment}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
