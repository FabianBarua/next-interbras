"use client"

import Link from "@/i18n/link"
import Image from "next/image"
import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { getVariantMainImage } from "@/lib/variant-images"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { QuantitySelector } from "./quantity-selector"
import { PriceDisplay } from "./price-display"
import { ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CartPreview() {
  const { cart, removeItem, isSheetOpen, setSheetOpen } = useCartStore()
  const { dict, locale } = useDictionary()
  const [count, setCount] = useState(0)

  // Hydration-safe count
  useEffect(() => {
    setCount(useCartStore.getState().cart.totalItems)
    return useCartStore.subscribe((state) => setCount(state.cart.totalItems))
  }, [])

  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.variant?.externalCode?.priceUsd || 0) * item.quantity,
    0
  )

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        aria-label={dict.nav.cart}
        onClick={() => setSheetOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </Button>

      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{dict.cart.myCart} ({cart.totalItems})</SheetTitle>
          </SheetHeader>

          {cart.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">{dict.cart.emptyTitle}</h3>
              <p className="max-w-[250px] text-sm text-muted-foreground">
                {dict.cart.emptyMsg}
              </p>
              <Button variant="default" onClick={() => setSheetOpen(false)}>
                {dict.cart.backToStore}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const img = getVariantMainImage(item.variant)
                    const name = item.product.name[locale] || item.product.name.es || "Producto"
                    const variantName = item.variant?.name?.[locale] || item.variant?.name?.es

                    return (
                      <div key={item.id} className="relative flex gap-3 border-b pb-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted/20">
                          {img && (
                            <Image src={img.url} alt={name} fill className="object-contain p-2" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-1">
                          <Link
                            href={`/productos/${item.product.category?.slug || "cat"}/${item.product.slug}`}
                            className="pr-6 text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
                            onClick={() => setSheetOpen(false)}
                          >
                            {name}
                          </Link>

                          {variantName && (
                            <span className="text-xs text-muted-foreground">{variantName}</span>
                          )}

                          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                            <QuantitySelector itemId={item.id} initialQuantity={item.quantity} />
                            <PriceDisplay
                              externalCode={item.variant?.externalCode || item.product.variants[0]?.externalCode}
                              className="items-end text-sm"
                            />
                          </div>
                        </div>

                        <button
                          title={dict.cart.deleteItem}
                          onClick={() => removeItem(item.id)}
                          className="absolute right-0 top-0 rounded-sm p-1 text-destructive opacity-50 transition-all hover:bg-accent hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="border-t px-6 py-4">
                <div className="mb-4 flex items-center justify-between text-lg font-semibold">
                  <span>{dict.common.subtotal}</span>
                  <span>US$ {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>

                <p className="mb-3 text-center text-xs text-muted-foreground">
                  {dict.cart.taxNotice}
                </p>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/carrito"
                    className="w-full rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setSheetOpen(false)}
                  >
                    {dict.cart.viewCart}
                  </Link>

                  <Link
                    href="/checkout"
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    onClick={() => setSheetOpen(false)}
                  >
                    {dict.cart.processOrder}
                  </Link>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
