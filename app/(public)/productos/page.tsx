import { getVariantEntries } from "@/services/products"
import { getCategories } from "@/services/categories"
import { ProductCard } from "@/components/store/product-card"
import { Breadcrumbs } from "@/components/store/breadcrumbs"

export default async function ProductsPage() {
  const [entries, categories] = await Promise.all([
    getVariantEntries(),
    getCategories(),
  ])

  return (
    <div className="container px-4 py-8">
      <Breadcrumbs items={[{ label: "Productos" }]} />
      
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Categorías</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <a 
                    href={`/productos/${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex justify-between"
                  >
                    <span>{category.name.es}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
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
            <h1 className="text-3xl font-bold tracking-tight">Todos los Productos</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{entries.length} variantes</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {entries.map((entry) => (
              <ProductCard
                key={entry.variant?.id || entry.product.id}
                product={entry.product}
                variant={entry.variant}
              />
            ))}
          </div>

          {/* Simple pagination mock */}
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-md border bg-muted text-muted-foreground cursor-not-allowed">Anterior</button>
              <button className="h-10 w-10 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium">1</button>
              <button className="h-10 w-10 flex items-center justify-center rounded-md border hover:bg-accent transition-colors">2</button>
              <button className="h-10 px-4 rounded-md border hover:bg-accent transition-colors">Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
