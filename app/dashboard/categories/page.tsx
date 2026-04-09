import { requireAdmin } from "@/lib/auth/get-session"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { CategoriesTable } from "./table"

export default async function CategoriesPage() {
  await requireAdmin()
  const categories = await getAllCategoriesAdmin()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de categorías de productos (ES / PT)</p>
      </div>
      <CategoriesTable items={categories} />
    </div>
  )
}
