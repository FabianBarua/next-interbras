import { getVariantEntries } from "@/services/products"

export const dynamic = "force-dynamic"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { ProductGridWithFilters } from "@/components/store/product-grid-with-filters"
import { getDictionary } from "@/i18n/get-dictionary"

export default async function ProductsPage() {
  const [entries, dict] = await Promise.all([
    getVariantEntries(),
    getDictionary(),
  ])

  return (
    <div className="container px-4 py-4">
      <Breadcrumbs items={[{ label: dict.products.title }]} />

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">{dict.products.allProducts}</h1>
        <ProductGridWithFilters entries={entries} showCategories />
      </div>
    </div>
  )
}
