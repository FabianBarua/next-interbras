"use client"

import { Suspense } from "react"
import type { VariantEntry } from "@/services/products"
import type { Facets } from "@/lib/search/types"
import { filterEntries } from "@/lib/search/filter-entries"
import { useFilterParams } from "@/hooks/use-filter-params"
import { useDictionary } from "@/i18n/context"
import { ProductCard } from "@/components/store/product-card"
import { SearchInput } from "@/components/store/search-input"
import { ActiveFilters } from "@/components/store/active-filters"
import { SortSelect } from "@/components/store/sort-select"
import { ProductFiltersDesktop, ProductFiltersMobile } from "@/components/store/product-filters"
import { extractFacets } from "@/lib/search/extract-facets"
import { PackageOpen } from "lucide-react"

interface ProductGridWithFiltersProps {
  entries: VariantEntry[]
  showCategories?: boolean
}

function ProductGridInner({ entries, showCategories = false }: ProductGridWithFiltersProps) {
  const { dict, locale } = useDictionary()
  const {
    filters,
    setQuery,
    setSort,
    setPriceRange,
    toggleAttribute,
    clearFilter,
    clearAll,
    hasActiveFilters,
  } = useFilterParams()

  // Compute facets from ALL entries (before filtering) so counts stay stable
  const facets: Facets = extractFacets(entries, locale)

  // Apply filters
  const filtered = filterEntries(entries, filters, locale)

  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
      {/* Desktop sidebar */}
      <ProductFiltersDesktop
        facets={facets}
        filters={filters}
        onToggleAttribute={toggleAttribute}
        onSetPriceRange={setPriceRange}
        showCategories={showCategories}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar: search + sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ProductFiltersMobile
              facets={facets}
              filters={filters}
              onToggleAttribute={toggleAttribute}
              onSetPriceRange={setPriceRange}
              showCategories={showCategories}
            />
            <SearchInput
              value={filters.q}
              onChange={setQuery}
              className="flex-1 sm:w-72"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length} {dict.products.results}
            </span>
            <SortSelect value={filters.sort} onChange={setSort} />
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mb-4">
            <ActiveFilters
              filters={filters}
              onClear={clearFilter}
              onClearAll={clearAll}
            />
          </div>
        )}

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((entry) => (
              <ProductCard
                key={entry.variant?.id || entry.product.id}
                product={entry.product}
                variant={entry.variant}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border">
            <PackageOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {dict.products.noProducts}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-md">
              {dict.products.noProductsDesc}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="mt-4 text-sm text-primary hover:underline underline-offset-4"
              >
                {dict.products.clearFilters}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Wrapper with Suspense boundary for useSearchParams */
export function ProductGridWithFilters(props: ProductGridWithFiltersProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductGridInner {...props} />
    </Suspense>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
      <aside className="hidden md:block w-56 shrink-0">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </aside>
      <div className="flex-1">
        <div className="h-10 w-full max-w-xs rounded-lg bg-muted/50 animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
