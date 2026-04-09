"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useDictionary } from "@/i18n/context"
import { RESERVED_PARAMS } from "@/lib/search/types"
import type { FilterState } from "@/lib/search/types"

interface ActiveFiltersProps {
  filters: FilterState
  onClear: (key: string, value?: string) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, onClear, onClearAll }: ActiveFiltersProps) {
  const { dict } = useDictionary()

  const chips: { key: string; label: string; value?: string }[] = []

  if (filters.q) {
    chips.push({ key: "q", label: `"${filters.q}"` })
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const parts: string[] = []
    if (filters.minPrice != null) parts.push(`${dict.products.min}: $${filters.minPrice}`)
    if (filters.maxPrice != null) parts.push(`${dict.products.max}: $${filters.maxPrice}`)
    chips.push({ key: "price", label: parts.join(" - ") })
  }
  if (filters.sort !== "relevance") {
    const sortLabels: Record<string, string> = {
      "price-asc": dict.products.sortPriceAsc,
      "price-desc": dict.products.sortPriceDesc,
      "name-asc": dict.products.sortNameAsc,
      newest: dict.products.sortNewest,
    }
    chips.push({ key: "sort", label: sortLabels[filters.sort] || filters.sort })
  }

  for (const [key, values] of Object.entries(filters.attributes)) {
    for (const value of values) {
      chips.push({ key, label: `${key}: ${value}`, value })
    }
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {dict.products.activeFilters}:
      </span>
      {chips.map((chip, i) => (
        <Badge
          key={`${chip.key}-${chip.value ?? i}`}
          variant="secondary"
          className="gap-1 pl-2.5 pr-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => {
            if (chip.key === "price") {
              onClear("minPrice")
              onClear("maxPrice")
            } else {
              onClear(chip.key, chip.value)
            }
          }}
        >
          {chip.label}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
      >
        {dict.products.clearFilters}
      </button>
    </div>
  )
}
