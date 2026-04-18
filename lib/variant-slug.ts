import type { Product, Variant } from "@/types/product"

/**
 * Build a URL-friendly slug for a specific variant.
 * Format: {productSlug}-{cecCode} (lowercased, sanitised)
 */
export function toVariantSlug(product: Product, variant?: Variant): string {
  const parts = [product.slug]
  if (variant?.externalCode?.code) parts.push(variant.externalCode.code)
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
