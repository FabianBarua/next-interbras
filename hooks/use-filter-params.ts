"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useTransition } from "react"
import { parseFilters, serializeFilters } from "@/lib/search/parse-filters"
import type { FilterState, SortOption } from "@/lib/search/types"
import { RESERVED_PARAMS } from "@/lib/search/types"

/** Client hook: read/write filter state synced with URL searchParams */
export function useFilterParams() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const updateURL = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      startTransition(() => {
        router.replace(url, { scroll: false })
      })
    },
    [pathname, router, startTransition],
  )

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value == null || value === "" || value === "relevance") {
        next.delete(String(key))
      } else {
        next.set(String(key), String(value))
      }
      updateURL(next)
    },
    [searchParams, updateURL],
  )

  /** Set text query with debounce (300ms) */
  const setQuery = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setFilter("q", q)
      }, 300)
    },
    [setFilter],
  )

  /** Toggle a value within a dynamic attribute array param */
  const toggleAttribute = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString())
      const existing = next.getAll(key)
      if (existing.includes(value)) {
        // Remove this value
        next.delete(key)
        for (const v of existing) {
          if (v !== value) next.append(key, v)
        }
      } else {
        next.append(key, value)
      }
      updateURL(next)
    },
    [searchParams, updateURL],
  )

  /** Remove a specific filter key (or key+value for attributes) */
  const clearFilter = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value && !RESERVED_PARAMS.has(key)) {
        // Remove a specific attribute value
        const existing = next.getAll(key)
        next.delete(key)
        for (const v of existing) {
          if (v !== value) next.append(key, v)
        }
      } else {
        next.delete(key)
      }
      updateURL(next)
    },
    [searchParams, updateURL],
  )

  /** Remove all filters */
  const clearAll = useCallback(() => {
    updateURL(new URLSearchParams())
  }, [updateURL])

  /** Set sort option */
  const setSort = useCallback(
    (sort: SortOption) => setFilter("sort", sort),
    [setFilter],
  )

  /** Set price range */
  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (min != null) next.set("minPrice", String(min))
      else next.delete("minPrice")
      if (max != null) next.set("maxPrice", String(max))
      else next.delete("maxPrice")
      updateURL(next)
    },
    [searchParams, updateURL],
  )

  /** Check whether any filters are active */
  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.q ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.sort !== "relevance" ||
      Object.keys(filters.attributes).length > 0
    )
  }, [filters])

  return {
    filters,
    isPending,
    setFilter,
    setQuery,
    setSort,
    setPriceRange,
    toggleAttribute,
    clearFilter,
    clearAll,
    hasActiveFilters,
  }
}
