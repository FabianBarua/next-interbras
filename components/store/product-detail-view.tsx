"use client"

import { useState, useCallback } from "react"
import type { Product } from "@/types/product"
import { ProductGallery } from "./product-gallery"
import { ProductInfo } from "./product-info"
import { useDictionary } from "@/i18n/context"

export function ProductDetailView({
  product,
  initialVariantId,
  categorySlug,
}: {
  product: Product
  initialVariantId?: string
  categorySlug?: string
}) {
  const { locale } = useDictionary()
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariantId || product.variants[0]?.id
  )

  const name = product.name[locale] || product.name.es
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0]

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-14 items-start">
      {/* Gallery */}
      <div className="w-full md:w-[55%] lg:w-[58%]">
        <ProductGallery variant={selectedVariant} alt={name} />
      </div>

      {/* Info */}
      <div className="w-full md:w-[45%] lg:w-[42%] md:sticky md:top-24">
        <ProductInfo
          product={product}
          initialVariantId={initialVariantId}
          categorySlug={categorySlug}
          onVariantChange={setSelectedVariantId}
        />
      </div>
    </div>
  )
}
