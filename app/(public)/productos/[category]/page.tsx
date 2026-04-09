import { getVariantEntriesByCategory } from "@/services/products"
import { getCategoryBySlug as fetchCategoryBySlug } from "@/services/categories"
import { ProductCard } from "@/components/store/product-card"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const resolvedParams = await params
  const categorySlug = resolvedParams.category

  const category = await fetchCategoryBySlug(categorySlug)
  
  if (!category) {
    notFound()
  }

  const entries = await getVariantEntriesByCategory(category.slug)

  return (
    <div className="container px-4 py-8">
      <Breadcrumbs items={[
        { label: "Productos", href: "/productos" },
        { label: category.name.es }
      ]} />
      
      {/* Category Header */}
      <div className="bg-muted p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{category.name.es}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1 text-sm max-w-2xl">{category.description.es}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-56 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-sm mb-3">Filtrar por Precio</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="w-full rounded-md border h-9 px-3 text-sm" />
              <span>-</span>
              <input type="number" placeholder="Max" className="w-full rounded-md border h-9 px-3 text-sm" />
            </div>
            <button className="mt-3 w-full h-9 bg-accent text-sm font-medium rounded-md hover:bg-accent/80 transition-colors">
              Aplicar
            </button>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{entries.length} variantes</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {entries.map((entry) => (
              <ProductCard
                key={entry.variant?.id || entry.product.id}
                product={entry.product}
                variant={entry.variant}
              />
            ))}
            {entries.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-lg border">
                No hay productos en esta categoría por el momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
