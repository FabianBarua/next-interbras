import type { ProductImage, Variant } from "@/types/product"

/**
 * Return images for a variant. Only its own direct images — no fallback.
 */
export function getVariantImages(variant?: Variant | null): ProductImage[] {
  return variant?.images ?? []
}

/** Pick the single best image to represent a variant (e.g. for cards, cart thumbnails). */
export function getVariantMainImage(variant?: Variant | null): ProductImage | undefined {
  const pool = getVariantImages(variant)
  return pool.find(img => img.isMain) || pool[0]
}
