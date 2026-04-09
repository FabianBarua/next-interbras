import type { ProductImage, Variant } from "@/types/product"

/**
 * Return images for a variant. Images are now carried directly on the Variant object
 * (assigned at the service layer with sibling/product-level fallback already resolved).
 */
export function getVariantImages(variant?: Variant | null): ProductImage[] {
  return variant?.images ?? []
}

/** Pick the single best image to represent a variant (e.g. for cards, cart thumbnails). */
export function getVariantMainImage(variant?: Variant | null): ProductImage | undefined {
  const pool = getVariantImages(variant)
  return pool.find(img => img.isMain) || pool[0]
}
