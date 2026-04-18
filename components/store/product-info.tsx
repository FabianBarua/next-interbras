"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Product, Variant } from "@/types/product"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toVariantSlug } from "@/lib/variant-slug"
import { useDictionary, useLocalePath } from "@/i18n/context"
import { useEcommerce } from "./ecommerce-context"
import { useCartStore } from "@/store/cart-store"
import { ShareNetworkIcon, MinusIcon, PlusIcon, ShoppingBagIcon, PackageIcon, ShieldCheckIcon, CreditCardIcon, StorefrontIcon } from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  // Sync when parent changes the variant (e.g. voltage warning switch)
  useEffect(() => {
    if (initialVariantId && initialVariantId !== selectedId) {
      setSelectedId(initialVariantId)
      setQuantity(1)
      const newVariant = product.variants.find((x) => x.id === initialVariantId)
      if (newVariant && categorySlug) {
        const newSlug = toVariantSlug(product, newVariant)
        window.history.replaceState(null, "", `/${locale}/productos/${categorySlug}/${newSlug}`)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVariantId])
  const v = product.variants.find((x) => x.id === selectedId) || product.variants[0]
  const name = product.name[locale] || product.name.es
  const stock = v?.stock ?? null
  const cecCode = v?.externalCode?.code
  const maxQty = stock !== null ? Math.min(stock, 99) : 99

  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedId(variantId)
    setQuantity(1)
    onVariantChange?.(variantId)
    const newVariant = product.variants.find((x) => x.id === variantId)
    if (newVariant && categorySlug) {
      const newSlug = toVariantSlug(product, newVariant)
      window.history.replaceState(null, "", `/${locale}/productos/${categorySlug}/${newSlug}`)
    }
  }, [product, categorySlug, onVariantChange, locale])

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

  const attrKeys = getAttributeKeys(product.variants)

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div>
        <Badge variant="secondary" className="mb-2">
          {product.category?.name?.[locale] || product.category?.name?.es}
        </Badge>
        <h1 className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight leading-tight">{name}</h1>
        {v?.code && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              SKU: {v.code}
              {cecCode && <span className="ml-2">· CEC: {cecCode}</span>}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-xs" onClick={handleShare} className="ml-auto">
                    <ShareNetworkIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{dict.products.shareProduct}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <Separator />

      {/* Price + Stock */}
      {ecommerce && (
        <div className="space-y-2">
          <PriceDisplay externalCode={v?.externalCode} className="text-2xl" />
          {stock !== null && stock > 0 ? (
            <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">
              {dict.products.stock}: {stock}
            </Badge>
          ) : stock === 0 ? (
            <Badge variant="destructive">
              {dict.products.outOfStock}
            </Badge>
                    ) : (
            <Badge variant="secondary">
              {dict.products.checkAvailability}
            </Badge>
          )}
        </div>
      )}

      {/* Variant selectors */}
      {attrKeys.length > 0 && product.variants.length > 1 && (
        <>
          <Separator />
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
        </>
      )}

      <Separator />

      {/* Actions */}
      {ecommerce && (
        <div className="space-y-3">
          {/* Quantity + Add to Cart + Wishlist */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="rounded-r-none"
              >
                <MinusIcon className="size-3.5" />
              </Button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n) && n >= 1 && n <= maxQty) setQuantity(n)
                }}
                className="w-10 h-8 text-center text-sm font-medium bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="rounded-l-none"
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>
            <AddToCartButton product={product} variant={v} quantity={quantity} className="flex-1 h-9" />
            <WishlistButton product={product} variant={v} className="border h-9 w-9 shrink-0 rounded-md" />
          </div>

          {/* Buy Now */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleBuyNow}
            disabled={v?.stock === 0}
            className="w-full"
          >
            <ShoppingBagIcon data-icon="inline-start" className="size-4" />
            {dict.products.buyNow}
          </Button>
        </div>
      )}

      <Separator />

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <BenefitItem icon={<PackageIcon className="size-4" />} text={dict.products.shippingBadge} />
        <BenefitItem icon={<ShieldCheckIcon className="size-4" />} text={dict.products.warrantyBadge} />
        <BenefitItem icon={<CreditCardIcon className="size-4" />} text={dict.products.cardBadge} />
        <BenefitItem icon={<StorefrontIcon className="size-4" />} text={dict.products.storeBadge} />
      </div>
    </div>
  )
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="text-primary shrink-0">{icon}</span>
      <span>{text}</span>
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
  const values = Array.from(new Set(variants.map((v) => v.attributes[attrKey]).filter(Boolean)))
  const selectedValue = selectedVariant.attributes[attrKey]

  const labelMap: Record<string, string> = {
    color: dict.products.attrColor,
    voltage: dict.products.attrVoltage,
    size: dict.products.attrSize,
    capacity: dict.products.attrCapacity,
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        {labelMap[attrKey] || attrKey}: <span className="font-medium text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((val) => {
          const active = val === selectedValue
          const target = findExactVariant(variants, attrKey, val, selectedVariant)
          const available = !!target
          return (
            <Button
              key={val}
              variant={active ? "default" : "outline"}
              size="sm"
              disabled={!available}
              onClick={() => available && onSelect(target.id)}
              className={cn(
                "relative",
                active && "pointer-events-none"
              )}
            >
              {val}
              {!available && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
                  <span className="block w-[calc(100%-8px)] h-px bg-muted-foreground/30 -rotate-12" />
                </span>
              )}
            </Button>
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
  const otherKeys = Object.keys(current.attributes).filter((k) => k !== changedKey)
  return variants.find((v) => {
    if (v.attributes[changedKey] !== newValue) return false
    return otherKeys.every((k) => v.attributes[k] === current.attributes[k])
  })
}
