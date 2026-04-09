"use client"

import { useCartStore } from "@/store/cart-store"
import { useDictionary } from "@/i18n/context"
import { getVariantMainImage } from "@/lib/variant-images"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { QuantitySelector } from "./quantity-selector"
import { PriceDisplay } from "./price-display"
import Image from "next/image"
import Link from "@/i18n/link"
import React, { useState } from "react"

export function CartDrawer({ children }: { children: React.ReactNode }) {
  const { cart, removeItem } = useCartStore()
  const { dict, locale } = useDictionary()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background">
        <SheetHeader>
          <SheetTitle>{dict.cart.myCart} ({cart.totalItems})</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <h3 className="font-semibold text-lg">{dict.cart.emptyTitle}</h3>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                {dict.cart.emptyMsg}
              </p>
              <button 
                onClick={() => setOpen(false)}
                className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                {dict.cart.backToStore}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pr-2">
              {cart.items.map((item) => {
                const img = getVariantMainImage(item.variant)
                const name = item.product.name[locale] || item.product.name.es || "Producto"
                const variantName = item.variant?.name?.[locale] || item.variant?.name?.es
                
                return (
                  <div key={item.id} className="flex gap-4 border-b pb-6 relative">
                    <div className="relative w-24 h-24 bg-muted/20 rounded-md overflow-hidden shrink-0">
                      {img && (
                        <Image src={img.url} alt={name} fill className="object-contain p-2" />
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 gap-1">
                      <Link 
                        href={`/productos/${item.product.category?.slug || 'cat'}/${item.product.slug}`} 
                        className="font-medium line-clamp-2 text-sm pr-6 hover:text-primary transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        {name}
                      </Link>
                      
                      {variantName && (
                        <span className="text-xs text-muted-foreground">{variantName}</span>
                      )}
                      
                      <div className="mt-auto pt-2 flex items-end justify-between gap-2">
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
                      className="absolute top-0 right-0 p-1 rounded-sm opacity-50 hover:opacity-100 hover:bg-accent transition-all text-destructive"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {cart.items.length > 0 && (
          <div className="border-t pt-6 mt-auto flex flex-col gap-4">
            <div className="flex items-center justify-between font-semibold text-lg">
              <span>{dict.common.subtotal}</span>
              <span>US$ {cart.items.reduce((acc, curr) => acc + ((curr.variant?.externalCode?.priceUsd || 0) * curr.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {dict.cart.taxNotice}
            </p>
            
            <Link 
              href="/carrito" 
              className="w-full text-center px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors font-medium text-sm"
              onClick={() => setOpen(false)}
            >
              {dict.cart.viewCart}
            </Link>
            
            <Link 
              href="/checkout" 
              className="w-full text-center px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              onClick={() => setOpen(false)}
            >
              {dict.cart.processOrder}
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
