"use client"

import { useState } from "react"
import type { Product, Variant } from "@/types/product"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { Separator } from "@/components/ui/separator"

export function ProductInfo({ product, initialVariantId }: { product: Product; initialVariantId?: string }) {
  const [selectedId, setSelectedId] = useState(
    initialVariantId || product.variants[0]?.id
  )
  const v = product.variants.find((x) => x.id === selectedId) || product.variants[0]
  const name = product.name.es
  const stock = (v?.externalCode?.metadata as any)?.stock

  // Group variant attributes for selector
  const attrKeys = getAttributeKeys(product.variants)

  return (
    <div className="space-y-4">
      {/* Category + Name */}
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          {product.category?.name?.es}
        </p>
        <h1 className="text-xl font-bold tracking-tight leading-tight">{name}</h1>
        {v?.sku && (
          <p className="text-[11px] text-muted-foreground mt-1">SKU: {v.sku}</p>
        )}
      </div>

      {/* Price + stock */}
      <div className="flex items-end justify-between gap-4">
        <PriceDisplay externalCode={v?.externalCode} className="text-lg" />
        {stock > 0 ? (
          <span className="text-[11px] font-medium text-green-600 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Stock: {stock}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Consultar
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
              onSelect={setSelectedId}
            />
          ))}
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <AddToCartButton product={product} variant={v} className="flex-1 py-2.5 text-sm" />
        <WishlistButton product={product} className="border h-10 w-10 shrink-0" />
      </div>

      {/* Description */}
      {product.description?.es && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {product.description.es}
        </p>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <Badge icon="package" text="Envío a todo el país" />
        <Badge icon="shield" text="Garantía Interbras" />
        <Badge icon="card" text="Todas las tarjetas" />
        <Badge icon="store" text="Retiro en tienda" />
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
}: {
  label: string
  variants: Variant[]
  attrKey: string
  selectedVariant: Variant
  onSelect: (id: string) => void
}) {
  // Get unique values for this attr
  const values = Array.from(new Set(variants.map((v) => v.attributes[attrKey]).filter(Boolean)))
  const selectedValue = selectedVariant.attributes[attrKey]

  // Labels for known keys
  const labelMap: Record<string, string> = {
    color: "Color",
    voltage: "Voltaje",
    size: "Tamaño",
    capacity: "Capacidad",
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
        {labelMap[attrKey] || attrKey}: <span className="text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => {
          const active = val === selectedValue
          // Find a variant that matches this value + current other attributes
          const target = findBestVariant(variants, attrKey, val, selectedVariant)
          return (
            <button
              key={val}
              onClick={() => target && onSelect(target.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {val}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function findBestVariant(
  variants: Variant[],
  changedKey: string,
  newValue: string,
  current: Variant
): Variant | undefined {
  // Try to find variant matching all current attrs but with this one changed
  const otherKeys = Object.keys(current.attributes).filter((k) => k !== changedKey)
  let match = variants.find((v) => {
    if (v.attributes[changedKey] !== newValue) return false
    return otherKeys.every((k) => v.attributes[k] === current.attributes[k])
  })
  if (!match) {
    // Fallback: any variant with that value
    match = variants.find((v) => v.attributes[changedKey] === newValue)
  }
  return match
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
