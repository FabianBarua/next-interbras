/** Search & filter type definitions */

export const SORT_OPTIONS = [
  "relevance",
  "price-asc",
  "price-desc",
  "name-asc",
  "newest",
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

/** Parsed & validated filter state derived from URL searchParams */
export interface FilterState {
  q: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  sort: SortOption
  /** Dynamic attributes, e.g. { color: ["Negro", "Blanco"], size: ["32"] } */
  attributes: Record<string, string[]>
}

export interface FacetValue {
  value: string
  count: number
}

export interface FacetCategory {
  slug: string
  name: string
  count: number
}

export interface Facets {
  attributes: Map<string, FacetValue[]>
  priceRange: { min: number; max: number }
  categories: FacetCategory[]
}

/** Reserved URL param keys that are NOT dynamic attribute filters */
export const RESERVED_PARAMS = new Set(["q", "category", "minPrice", "maxPrice", "sort"])
