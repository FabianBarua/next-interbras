"use client"

import { useState } from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/i18n/context"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { Facets, FacetCategory } from "@/lib/search/types"
import type { FilterState } from "@/lib/search/types"

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface ProductFiltersProps {
  facets: Facets
  filters: FilterState
  onToggleAttribute: (key: string, value: string) => void
  onSetPriceRange: (min: number | null, max: number | null) => void
  /** Category links — only on /productos (all products), not on category pages */
  showCategories?: boolean
}

/* -------------------------------------------------------------------------- */
/*  FilterPanel — the actual sidebar content (shared desktop / mobile)        */
/* -------------------------------------------------------------------------- */

function FilterPanel({
  facets,
  filters,
  onToggleAttribute,
  onSetPriceRange,
  showCategories = false,
}: ProductFiltersProps) {
  const { dict, locale } = useDictionary()
  const [minInput, setMinInput] = useState(filters.minPrice != null ? String(filters.minPrice) : "")
  const [maxInput, setMaxInput] = useState(filters.maxPrice != null ? String(filters.maxPrice) : "")

  const handleApplyPrice = () => {
    const min = minInput ? Number(minInput) : null
    const max = maxInput ? Number(maxInput) : null
    if (min != null && !Number.isFinite(min)) return
    if (max != null && !Number.isFinite(max)) return
    onSetPriceRange(min, max)
  }

  // Localized attribute key labels (capitalize first letter)
  const attrLabel = (key: string) =>
    key.charAt(0).toUpperCase() + key.slice(1)

  return (
    <div className="space-y-6">
      {/* Categories */}
      {showCategories && facets.categories.length > 0 && (
        <FilterSection title={dict.products.categories} defaultOpen>
          <ul className="space-y-1.5">
            {facets.categories.map((cat) => (
              <li key={cat.slug}>
                <a
                  href={`/productos/${cat.slug}`}
                  className="flex items-center justify-between text-sm text-muted-foreground hover:text-primary transition-colors py-0.5"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground/60">
                    {cat.count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* Price range */}
      {facets.priceRange.max > 0 && (
        <FilterSection title={dict.products.priceFilter} defaultOpen>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder={dict.products.min}
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
                  className="h-9 w-full rounded-md border border-input bg-background pl-6 pr-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  min={0}
                />
              </div>
              <span className="text-muted-foreground text-xs">–</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder={dict.products.max}
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
                  className="h-9 w-full rounded-md border border-input bg-background pl-6 pr-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  min={0}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              ${facets.priceRange.min} – ${facets.priceRange.max} USD
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleApplyPrice}
            >
              {dict.products.applyFilter}
            </Button>
          </div>
        </FilterSection>
      )}

      {/* Dynamic attribute filters */}
      {Array.from(facets.attributes.entries()).map(([key, values]) => (
        <FilterSection key={key} title={attrLabel(key)} defaultOpen>
          <div className="space-y-2">
            {values.map((fv) => {
              const isChecked = filters.attributes[key]?.includes(fv.value) ?? false
              return (
                <label
                  key={fv.value}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleAttribute(key, fv.value)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                    {fv.value}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground/60">
                    {fv.count}
                  </span>
                </label>
              )
            })}
          </div>
        </FilterSection>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  FilterSection — collapsible section wrapper                               */
/* -------------------------------------------------------------------------- */

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

/* -------------------------------------------------------------------------- */
/*  Desktop sidebar                                                           */
/* -------------------------------------------------------------------------- */

export function ProductFiltersDesktop(props: ProductFiltersProps) {
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <FilterPanel {...props} />
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mobile sheet                                                              */
/* -------------------------------------------------------------------------- */

export function ProductFiltersMobile(props: ProductFiltersProps) {
  const { dict } = useDictionary()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {dict.products.showFilters}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto p-6">
        <SheetHeader className="p-0 pb-4">
          <SheetTitle>{dict.products.showFilters}</SheetTitle>
        </SheetHeader>
        <FilterPanel {...props} />
      </SheetContent>
    </Sheet>
  )
}
