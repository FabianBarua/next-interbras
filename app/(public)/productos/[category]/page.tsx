import { getVariantEntriesByCategory } from "@/services/products"
import { getCategoryBySlug as fetchCategoryBySlug } from "@/services/categories"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { ProductGridWithFilters } from "@/components/store/product-grid-with-filters"
import { notFound } from "next/navigation"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const resolvedParams = await params
  const categorySlug = resolvedParams.category

  const [category, dict, locale] = await Promise.all([
    fetchCategoryBySlug(categorySlug),
    getDictionary(),
    getLocale(),
  ])

  if (!category) {
    notFound()
  }

  const entries = await getVariantEntriesByCategory(category.slug)
  const categoryName = category.name[locale] || category.name.es

  return (
    <div className="container px-4 py-4">
      <Breadcrumbs items={[
        { label: dict.products.title, href: "/productos" },
        { label: categoryName }
      ]} />

      {/* Category Header */}
      <div className="bg-muted p-6 rounded-2xl mb-6 mt-4 flex flex-col md:flex-row items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{categoryName}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
              {category.description[locale] || category.description.es}
            </p>
          )}
        </div>
      </div>

      <ProductGridWithFilters entries={entries} />
    </div>
  )
}
