import { getProductsByCategory } from "@/services/products"
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

  const products = await getProductsByCategory(category.slug)

  return (
    <div className="container px-4 py-8">
      <Breadcrumbs items={[
        { label: "Productos", href: "/productos" },
        { label: category.name.es }
      ]} />
      
      {/* Category Header */}
      <div className="bg-muted p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-6">
        {category.image && (
          <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
             {/* Fallback to image tag or SVG */}
             <img src={category.image} alt={category.name.es} className="w-12 h-12 object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{category.name.es}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{category.description.es}</p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Filtrar por Precio</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="w-full rounded-md border h-9 px-3 text-sm" />
              <span>-</span>
              <input type="number" placeholder="Max" className="w-full rounded-md border h-9 px-3 text-sm" />
            </div>
            <button className="mt-4 w-full h-9 bg-accent text-sm font-medium rounded-md hover:bg-accent/80 transition-colors">
              Aplicar Filtro
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{products.length} productos en esta categoría</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
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
