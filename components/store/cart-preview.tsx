"use client"

import Link from "@/i18n/link"
import Image from "next/image"
import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { useState, useRef, useEffect, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { CartDrawer } from "./cart-drawer"

export function CartPreview() {
  const { cart, removeItem, lastAddedAt } = useCartStore()
  const { dict, locale } = useDictionary()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false) // controls the actual render for animation
  const hoverRef = useRef(false)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.variant?.externalCode?.priceUsd || 0) * item.quantity,
    0
  )

  const clearAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current)
      autoCloseRef.current = null
    }
  }, [])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    // wait for fade-out animation
    setTimeout(() => setVisible(false), 200)
  }, [])

  const openDropdown = useCallback(() => {
    setVisible(true)
    // next frame so the fade-in triggers
    requestAnimationFrame(() => setOpen(true))
  }, [])

  // Auto-show after adding to cart
  useEffect(() => {
    if (lastAddedAt === 0) return
    clearAutoClose()
    openDropdown()

    autoCloseRef.current = setTimeout(() => {
      if (!hoverRef.current) {
        closeDropdown()
      }
    }, 3000)

    return clearAutoClose
  }, [lastAddedAt, clearAutoClose, openDropdown, closeDropdown])

  const isMobile = useIsMobile()

  const handleEnter = () => {
    if (isMobile) return
    hoverRef.current = true
    clearAutoClose()
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    openDropdown()
  }

  const handleLeave = () => {
    if (isMobile) return
    hoverRef.current = false
    hoverTimeoutRef.current = setTimeout(() => {
      closeDropdown()
    }, 250)
  }

  const cartIcon = (
    <span className="relative inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
      <span className="sr-only">{dict.nav.cart}</span>
      {cart.totalItems > 0 && (
        <span
          key={lastAddedAt}
          className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 animate-[badgePop_0.35s_ease-out]"
        >
          {cart.totalItems}
        </span>
      )}
    </span>
  )

  // Mobile: use Sheet via CartDrawer
  if (isMobile) {
    return (
      <CartDrawer>
        <button className="relative">{cartIcon}</button>
      </CartDrawer>
    )
  }

  // Desktop: hover dropdown
  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Cart Icon */}
      <Link
        href="/carrito"
        className="relative flex items-center justify-center"
      >
        {cartIcon}
      </Link>

      {/* Dropdown */}
      {visible && (
        <div
          className={`absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border bg-popover text-popover-foreground shadow-xl transition-all duration-200 ${
            open
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-1 scale-[0.97] pointer-events-none"
          }`}
        >
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
              </div>
              <p className="text-sm font-medium">{dict.nav.emptyCart}</p>
              <p className="text-xs text-muted-foreground mt-1">{dict.nav.emptyCartHint}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">{dict.cart.title} ({cart.totalItems})</p>
              </div>

              {/* Items */}
              <div className="max-h-64 overflow-y-auto">
                {cart.items.slice(0, 4).map((item) => {
                  const img = item.product.images.find((i) => i.isMain) || item.product.images[0]
                  const name = item.product.name[locale] || item.product.name.es || "Producto"
                  const priceUsd = item.variant?.externalCode?.priceUsd || 0

                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 group/item">
                      <div className="relative w-12 h-12 bg-muted/30 rounded-md overflow-hidden shrink-0">
                        {img && (
                          <Image src={img.url} alt={name} fill className="object-contain p-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × US$ {priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeItem(item.id)
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded-sm hover:bg-destructive/10 text-destructive transition-all shrink-0"
                        title={dict.common.remove}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  )
                })}
                {cart.items.length > 4 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      +{cart.items.length - 4} {dict.common.products} {dict.common.more}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{dict.common.subtotal}</span>
                  <span className="text-sm font-bold">
                    US$ {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/carrito"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    {dict.nav.viewCart}
                  </Link>
                  <Link
                    href="/checkout"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {dict.nav.checkout}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
