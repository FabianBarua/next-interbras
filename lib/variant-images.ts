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

// ---------------------------------------------------------------------------
// Shared image resolution: direct → sibling (best attribute match) → product
// ---------------------------------------------------------------------------

interface VariantForImageResolve {
  id: string
  options: Record<string, string>
}

/**
 * Resolve images for a set of variants using a 3-tier fallback:
 *   1. Direct images (variantId matches)
 *   2. Sibling variant images with the highest attribute overlap
 *      - Ties broken by: more images first, then lower sortOrder of first image
 *      - Requires at least 1 matching attribute
 *   3. Product-level images (variantId = null)
 *
 * Generic over image type so both admin and public services can share this.
 */
export function resolveVariantImageMap<TImage>(
  variantList: VariantForImageResolve[],
  imgByVariant: Map<string, TImage[]>,
  productLevelImages: TImage[],
): Map<string, TImage[]> {
  const result = new Map<string, TImage[]>()

  // Pre-index options for O(1) lookup instead of repeated .find()
  const optionsById = new Map<string, Record<string, string>>()
  for (const v of variantList) {
    optionsById.set(v.id, v.options ?? {})
  }

  for (const v of variantList) {
    // 1) Direct images
    let images = imgByVariant.get(v.id)
    if (images && images.length > 0) {
      result.set(v.id, images)
      continue
    }

    // 2) Sibling fallback
    const attrEntries = Object.entries(v.options ?? {})
    if (attrEntries.length > 0) {
      let bestImages: TImage[] = []
      let bestScore = 0

      for (const [sibId, sibImgs] of imgByVariant) {
        if (sibId === v.id || sibImgs.length === 0) continue
        const sibOpts = optionsById.get(sibId)
        if (!sibOpts) continue

        let score = 0
        for (const [key, val] of attrEntries) {
          if (sibOpts[key] === val) score++
        }
        if (score === 0) continue

        // Pick higher score, then more images as tie-breaker
        if (
          score > bestScore ||
          (score === bestScore && sibImgs.length > bestImages.length)
        ) {
          bestScore = score
          bestImages = sibImgs
        }
      }

      if (bestImages.length > 0) {
        result.set(v.id, bestImages)
        continue
      }
    }

    // 3) Product-level fallback
    result.set(v.id, productLevelImages)
  }

  return result
}
