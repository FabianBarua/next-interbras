"use client"

import { useState, useCallback } from "react"
import type { Product, Variant } from "@/types/product"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { Separator } from "@/components/ui/separator"
import { toVariantSlug } from "@/lib/variant-slug"
import { useDictionary } from "@/i18n/context"

export function ProductInfo({ product, initialVariantId, categorySlug, onVariantChange }: { product: Product; initialVariantId?: string; categorySlug?: string; onVariantChange?: (variantId: string) => void }) {
  const { dict, locale } = useDictionary()
  const [selectedId, setSelectedId] = useState(
    initialVariantId || product.variants[0]?.id
  )
  const v = product.variants.find((x) => x.id === selectedId) || product.variants[0]
  const name = product.name[locale] || product.name.es
  const stock = v?.stock ?? null
  const cecCode = v?.externalCode?.code

  // Update URL bar when variant changes (no full navigation)
  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedId(variantId)
    onVariantChange?.(variantId)
    const newVariant = product.variants.find((x) => x.id === variantId)
    if (newVariant && categorySlug) {
      const newSlug = toVariantSlug(product, newVariant)
      window.history.replaceState(null, "", `/productos/${categorySlug}/${newSlug}`)
    }
  }, [product, categorySlug, onVariantChange])

  // Group variant attributes for selector
  const attrKeys = getAttributeKeys(product.variants)

  return (
    <div className="space-y-4">
      {/* Category + Name */}
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          {product.category?.name?.[locale] || product.category?.name?.es}
        </p>
        <h1 className="text-xl font-bold tracking-tight leading-tight">{name}</h1>
        {v?.sku && (
          <p className="text-[11px] text-muted-foreground mt-1">
            SKU: {v.sku}
            {cecCode && <span className="ml-2">Cód. CEC: {cecCode}</span>}
          </p>
        )}
      </div>

      {/* Price + stock */}
      <div className="flex items-end justify-between gap-4">
        <PriceDisplay externalCode={v?.externalCode} className="text-lg" />
        {stock !== null && stock > 0 ? (
          <span className="text-[11px] font-medium text-green-600 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {dict.products.stock}: {stock}
          </span>
        ) : stock === 0 ? (
          <span className="text-[11px] font-medium text-red-600 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {dict.products.outOfStock}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {dict.products.checkAvailability}
          </span>
        )}
      </div>

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

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <AddToCartButton product={product} variant={v} className="flex-1 py-2.5 text-sm" />
        <WishlistButton product={product} variant={v} className="border h-10 w-10 shrink-0" />
      </div>

      {/* Description */}
      {(product.description?.[locale] || product.description?.es) && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {product.description[locale] || product.description.es}
        </p>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <Badge icon="package" text={dict.products.shippingBadge} />
        <Badge icon="shield" text={dict.products.warrantyBadge} />
        <Badge icon="card" text={dict.products.cardBadge} />
        <Badge icon="store" text={dict.products.storeBadge} />
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
