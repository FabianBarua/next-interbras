import { RESERVED_PARAMS, SORT_OPTIONS, type FilterState, type SortOption } from "./types"

const MAX_Q_LENGTH = 100
const MAX_ATTR_VALUE_LENGTH = 50
const MAX_ATTR_VALUES = 20

/** Sanitize a string: trim, enforce max length, strip control chars */
function sanitize(raw: string, maxLen: number): string {
  // eslint-disable-next-line no-control-regex
  return raw.trim().replace(/[\x00-\x1f]/g, "").slice(0, maxLen)
}

/** Parse a numeric param, returning null if invalid or out of bounds */
function parsePrice(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 999_999) return null
  return Math.round(n * 100) / 100 // max 2 decimals
}

/** Parse and validate URL searchParams into a typed FilterState */
export function parseFilters(params: URLSearchParams): FilterState {
  const q = sanitize(params.get("q") ?? "", MAX_Q_LENGTH)

  const category = sanitize(params.get("category") ?? "", 100)

  const minPrice = parsePrice(params.get("minPrice"))
  const maxPrice = parsePrice(params.get("maxPrice"))

  const sortRaw = params.get("sort") ?? "relevance"
  const sort: SortOption = (SORT_OPTIONS as readonly string[]).includes(sortRaw)
    ? (sortRaw as SortOption)
    : "relevance"

  // Collect dynamic attribute filters (any param not in RESERVED_PARAMS)
  const attributes: Record<string, string[]> = {}
  for (const [key, value] of params.entries()) {
    if (RESERVED_PARAMS.has(key)) continue
    // Param key must be a-z, 0-9, underscores (simple alphanumeric)
    if (!/^[a-zA-Z0-9_]+$/.test(key)) continue
    if (!attributes[key]) attributes[key] = []
    if (attributes[key].length >= MAX_ATTR_VALUES) continue
    const clean = sanitize(value, MAX_ATTR_VALUE_LENGTH)
    if (clean && !attributes[key].includes(clean)) {
      attributes[key].push(clean)
    }
  }

  return { q, category, minPrice, maxPrice, sort, attributes }
}

/** Serialize FilterState back to URLSearchParams */
export function serializeFilters(state: Partial<FilterState>): URLSearchParams {
  const params = new URLSearchParams()

  if (state.q) params.set("q", state.q)
  if (state.category) params.set("category", state.category)
  if (state.minPrice != null) params.set("minPrice", String(state.minPrice))
  if (state.maxPrice != null) params.set("maxPrice", String(state.maxPrice))
  if (state.sort && state.sort !== "relevance") params.set("sort", state.sort)

  if (state.attributes) {
    for (const [key, values] of Object.entries(state.attributes)) {
      for (const v of values) {
        params.append(key, v)
      }
    }
  }

  return params
}
