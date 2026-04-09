import { requireAdmin } from "@/lib/auth/get-session"
import { getAllProductsAdmin } from "@/services/admin/products"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { ProductsTable } from "./table"

export default async function ProductsPage() {
  await requireAdmin()
  const [products, categories] = await Promise.all([
    getAllProductsAdmin(),
    getAllCategoriesAdmin(),
  ])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de productos y variantes (ES / PT)</p>
      </div>
      <ProductsTable items={products} categories={categories} />
    </div>
  )
}
