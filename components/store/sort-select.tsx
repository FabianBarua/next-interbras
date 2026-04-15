"use client"

import { useDictionary } from "@/i18n/context"
import type { SortOption } from "@/lib/search/types"

interface SortSelectProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "price-asc", labelKey: "sortPriceAsc" },
  { value: "price-desc", labelKey: "sortPriceDesc" },
  { value: "name-asc", labelKey: "sortNameAsc" },
  { value: "newest", labelKey: "sortNewest" },
]

export function SortSelect({ value, onChange }: SortSelectProps) {
  const { dict } = useDictionary()
  const t = dict.products as Record<string, unknown>

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
        {dict.products.sortBy}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-9 min-w-0 max-w-[10rem] truncate rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {(t[opt.labelKey] as string) ?? opt.value}
          </option>
        ))}
      </select>
    </div>
  )
}
