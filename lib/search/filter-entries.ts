import type { VariantEntry } from "@/services/products"
import type { FilterState, SortOption } from "./types"
import type { Locale } from "@/types/common"

/** Normalize text for accent-insensitive matching */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

/** Check if entry matches the text query */
function matchesQuery(entry: VariantEntry, q: string, locale: Locale): boolean {
  if (!q) return true
  const normalized = normalize(q)
  const productName = entry.product.name?.[locale] || entry.product.name?.es || ""
  const categoryName = entry.product.category?.name?.[locale] || entry.product.category?.name?.es || ""
  const sku = entry.variant?.sku || ""

  return (
    normalize(productName).includes(normalized) ||
    normalize(categoryName).includes(normalized) ||
    normalize(sku).includes(normalized)
  )
}

/** Check if entry matches the price range */
function matchesPrice(entry: VariantEntry, minPrice: number | null, maxPrice: number | null): boolean {
  const price = entry.variant?.externalCode?.priceUsd
  if (price == null) return true // if no price, don't exclude
  if (minPrice != null && price < minPrice) return false
  if (maxPrice != null && price > maxPrice) return false
  return true
}

/** Check if entry matches attribute filters */
function matchesAttributes(entry: VariantEntry, attributes: Record<string, string[]>): boolean {
  const entryAttrs = entry.variant?.attributes
  if (!entryAttrs) return Object.keys(attributes).length === 0

  for (const [key, values] of Object.entries(attributes)) {
    if (values.length === 0) continue
    const entryValue = String(entryAttrs[key] ?? "")
    if (!values.includes(entryValue)) return false
  }
  return true
}

/** Sort entries by the given sort option */
function sortEntries(entries: VariantEntry[], sort: SortOption, locale: Locale): VariantEntry[] {
  if (sort === "relevance") return entries

  return [...entries].sort((a, b) => {
    switch (sort) {
      case "price-asc": {
        const pa = a.variant?.externalCode?.priceUsd ?? Infinity
        const pb = b.variant?.externalCode?.priceUsd ?? Infinity
        return pa - pb
      }
      case "price-desc": {
        const pa = a.variant?.externalCode?.priceUsd ?? -Infinity
        const pb = b.variant?.externalCode?.priceUsd ?? -Infinity
        return pb - pa
      }
      case "name-asc": {
        const na = (a.product.name?.[locale] || a.product.name?.es || "").toLowerCase()
        const nb = (b.product.name?.[locale] || b.product.name?.es || "").toLowerCase()
        return na.localeCompare(nb)
      }
      case "newest": {
        return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime()
      }
      default:
        return 0
    }
  })
}

/** Filter and sort variant entries based on the filter state */
export function filterEntries(
  entries: VariantEntry[],
  filters: FilterState,
  locale: Locale,
): VariantEntry[] {
  // Only show CEC-linked variants
  let result = entries.filter(e => !!e.variant?.externalCode)

  if (filters.q) {
    result = result.filter((e) => matchesQuery(e, filters.q, locale))
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    result = result.filter((e) => matchesPrice(e, filters.minPrice, filters.maxPrice))
  }

  if (Object.keys(filters.attributes).length > 0) {
    result = result.filter((e) => matchesAttributes(e, filters.attributes))
  }

  result = sortEntries(result, filters.sort, locale)

  return result
}
