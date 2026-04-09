import type { VariantEntry } from "@/services/products"
import type { Locale } from "@/types/common"
import type { Facets, FacetValue, FacetCategory } from "./types"

/** Extract facets (available filter options + counts) from a set of entries */
export function extractFacets(entries: VariantEntry[], locale: Locale): Facets {
  const attrMap = new Map<string, Map<string, number>>()
  let priceMin = Infinity
  let priceMax = -Infinity
  const catMap = new Map<string, { slug: string; name: string; count: number }>()

  for (const entry of entries) {
    // Price range
    const price = entry.variant?.externalCode?.priceUsd
    if (price != null) {
      if (price < priceMin) priceMin = price
      if (price > priceMax) priceMax = price
    }

    // Variant attributes
    const attrs = entry.variant?.attributes
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        const strValue = String(value)
        if (!strValue) continue
        if (!attrMap.has(key)) attrMap.set(key, new Map())
        const valueMap = attrMap.get(key)!
        valueMap.set(strValue, (valueMap.get(strValue) ?? 0) + 1)
      }
    }

    // Categories
    const cat = entry.product.category
    if (cat) {
      const existing = catMap.get(cat.slug)
      if (existing) {
        existing.count++
      } else {
        catMap.set(cat.slug, {
          slug: cat.slug,
          name: cat.name?.[locale] || cat.name?.es || cat.slug,
          count: 1,
        })
      }
    }
  }

  // Convert attribute maps to sorted arrays
  const attributes = new Map<string, FacetValue[]>()
  for (const [key, valueMap] of attrMap) {
    const values = Array.from(valueMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value))
    // Only include attributes with more than 1 distinct value (otherwise not useful as filter)
    if (values.length > 1) {
      attributes.set(key, values)
    }
  }

  const categories: FacetCategory[] = Array.from(catMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    attributes,
    priceRange: {
      min: priceMin === Infinity ? 0 : priceMin,
      max: priceMax === -Infinity ? 0 : priceMax,
    },
    categories,
  }
}
