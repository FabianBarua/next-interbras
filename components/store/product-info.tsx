"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Product, Variant } from "@/types/product"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { Separator } from "@/components/ui/separator"
import { toVariantSlug } from "@/lib/variant-slug"
import { useDictionary, useLocalePath } from "@/i18n/context"
import { useEcommerce } from "./ecommerce-context"
import { useCartStore } from "@/store/cart-store"
import { Share2, Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

export function ProductInfo({ product, initialVariantId, categorySlug, onVariantChange }: { product: Product; initialVariantId?: string; categorySlug?: string; onVariantChange?: (variantId: string) => void }) {
  const { dict, locale } = useDictionary()
  const ecommerce = useEcommerce()
  const localePath = useLocalePath()
  const router = useRouter()
  const { addItem } = useCartStore()
  const [selectedId, setSelectedId] = useState(
    initialVariantId || product.variants[0]?.id
  )
  const [quantity, setQuantity] = useState(1)
  const v = product.variants.find((x) => x.id === selectedId) || product.variants[0]
  const name = product.name[locale] || product.name.es
  const stock = v?.stock ?? null
  const cecCode = v?.externalCode?.code
  const maxQty = stock !== null ? Math.min(stock, 99) : 99

  // Update URL bar when variant changes (no full navigation)
  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedId(variantId)
    setQuantity(1)
    onVariantChange?.(variantId)
    const newVariant = product.variants.find((x) => x.id === variantId)
    if (newVariant && categorySlug) {
      const newSlug = toVariantSlug(product, newVariant)
      window.history.replaceState(null, "", `/productos/${categorySlug}/${newSlug}`)
    }
  }, [product, categorySlug, onVariantChange])

  const handleBuyNow = useCallback(() => {
    if (v?.stock === 0) return
    addItem(product, quantity, v)
    router.push(localePath("/carrito"))
  }, [addItem, product, quantity, v, router, localePath])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success(dict.products.copied)
    }
  }, [name, dict])

  // Group variant attributes for selector
  const attrKeys = getAttributeKeys(product.variants)

  return (
    <div className="space-y-5">
      {/* Category + Name */}
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          {product.category?.name?.[locale] || product.category?.name?.es}
        </p>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{name}</h1>
        <div className="flex items-center gap-3 mt-2">
          {v?.sku && (
            <p className="text-[11px] text-muted-foreground">
              SKU: {v.sku}
              {cecCode && <span className="ml-2">CEC: {cecCode}</span>}
            </p>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <Share2 className="h-3 w-3" />
            {dict.products.shareProduct}
          </button>
        </div>
      </div>

      <Separator />

      {/* Price + stock */}
      {ecommerce && (
        <div className="flex items-end justify-between gap-4">
          <PriceDisplay externalCode={v?.externalCode} className="text-lg" />
          {stock !== null && stock > 0 ? (
            <span className="text-[11px] font-medium text-green-600 flex items-center gap-1 shrink-0 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {dict.products.stock}: {stock}
            </span>
          ) : stock === 0 ? (
            <span className="text-[11px] font-medium text-red-600 flex items-center gap-1 shrink-0 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {dict.products.outOfStock}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {dict.products.checkAvailability}
            </span>
          )}
        </div>
      )}

      {/* Variant selectors */}
      {attrKeys.length > 0 && product.variants.length > 1 && (
        <div className="space-y-3">
          {attrKeys.map((key) => (
            <VariantAttrSelector
              key={key}
              label={key}
              variants={product.variants}
              attrKey={key}
              selectedVariant={v}
              onSelect={handleVariantChange}
              dict={dict}
            />
          ))}
        </div>
      )}

      {/* Quantity + Actions */}
      {ecommerce && (
        <>
          <Separator />
          <div className="space-y-3">
            {/* Quantity selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground">{dict.products.quantity}</label>
              <div className="flex items-center rounded-lg border h-10 w-fit">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3 h-full hover:bg-muted disabled:opacity-40 transition-colors rounded-l-lg"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (!isNaN(n) && n >= 1 && n <= maxQty) setQuantity(n)
                  }}
                  className="w-12 text-center text-sm font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="px-3 h-full hover:bg-muted disabled:opacity-40 transition-colors rounded-r-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5">
              <AddToCartButton product={product} variant={v} quantity={quantity} className="flex-1 h-12 text-sm" />
              <WishlistButton product={product} variant={v} className="border h-12 w-12 shrink-0 rounded-lg" />
            </div>

            {/* Buy now */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={v?.stock === 0}
              className="w-full h-12 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4 w-4" />
              {dict.products.buyNow}
            </button>
          </div>
        </>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Badge icon="package" text={dict.products.shippingBadge} />
        <Badge icon="shield" text={dict.products.warrantyBadge} />
        <Badge icon="card" text={dict.products.cardBadge} />
        <Badge icon="store" text={dict.products.storeBadge} />
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70 pt-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        {dict.products.securePayment}
      </div>
    </div>
  )
}

function getAttributeKeys(variants: Variant[]): string[] {
  const keys = new Set<string>()
  for (const v of variants) {
    for (const k of Object.keys(v.attributes || {})) {
      keys.add(k)
    }
  }
  return Array.from(keys)
}

function VariantAttrSelector({
  label,
  variants,
  attrKey,
  selectedVariant,
  onSelect,
  dict,
}: {
  label: string
  variants: Variant[]
  attrKey: string
  selectedVariant: Variant
  onSelect: (id: string) => void
  dict: any
}) {
  // Get unique values for this attr
  const values = Array.from(new Set(variants.map((v) => v.attributes[attrKey]).filter(Boolean)))
  const selectedValue = selectedVariant.attributes[attrKey]

  // Labels for known keys
  const labelMap: Record<string, string> = {
    color: dict.products.attrColor,
    voltage: dict.products.attrVoltage,
    size: dict.products.attrSize,
    capacity: dict.products.attrCapacity,
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
        {labelMap[attrKey] || attrKey}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => {
          const active = val === selectedValue
          // Find a variant that matches this value + current other attributes (strict only)
          const target = findExactVariant(variants, attrKey, val, selectedVariant)
          const available = !!target
          return (
            <button
              key={val}
              disabled={!available}
              onClick={() => available && onSelect(target.id)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : available
                    ? "border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                    : "border-border/50 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              {val}
              {!available && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
                  <span className="block w-[calc(100%-8px)] h-px bg-muted-foreground/40 rotate-[-12deg]" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function findExactVariant(
  variants: Variant[],
  changedKey: string,
  newValue: string,
  current: Variant
): Variant | undefined {
  // Only find variant matching all current attrs but with this one changed — no fallback
  const otherKeys = Object.keys(current.attributes).filter((k) => k !== changedKey)
  return variants.find((v) => {
    if (v.attributes[changedKey] !== newValue) return false
    return otherKeys.every((k) => v.attributes[k] === current.attributes[k])
  })
}

const icons: Record<string, React.ReactNode> = {
  package: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  shield: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  card: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  store: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>,
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground p-2 rounded-md bg-muted/40">
      <span className="text-primary shrink-0">{icons[icon]}</span>
      <span>{text}</span>
    </div>
  )
}
