"use client"

import Link from "next/link"
import Image from "next/image"
import { useCartStore } from "@/store/cart-store"
import { useLocaleStore } from "@/store/locale-store"
import { useState, useRef } from "react"

export function CartPreview() {
  const { cart, removeItem } = useCartStore()
  const { locale } = useLocaleStore()
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const subtotal = cart.items.reduce(
    (acc, item) => acc + (item.variant?.externalCode?.priceUsd || 0) * item.quantity,
    0
  )

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Cart Icon / Trigger — click goes to /carrito */}
      <Link
        href="/carrito"
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted hover:text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
        <span className="sr-only">Carrito</span>
        {cart.totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
            {cart.totalItems}
          </span>
        )}
      </Link>

      {/* Hover dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Tu carrito está vacío</p>
              <p className="text-xs text-muted-foreground mt-1">Agrega productos para comenzar.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Mi Carrito ({cart.totalItems})</p>
              </div>

              {/* Items (max 3 visible) */}
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
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  )
                })}
                {cart.items.length > 4 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      +{cart.items.length - 4} producto{cart.items.length - 4 > 1 ? "s" : ""} más
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-bold">
                    US$ {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/carrito"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-md border hover:bg-muted transition-colors"
                  >
                    Ver Carrito
                  </Link>
                  <Link
                    href="/checkout"
                    className="flex-1 text-center text-xs font-medium py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Checkout
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
