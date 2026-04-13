import { requireAdmin } from "@/lib/auth/get-session"
import { CategoryForm } from "./client"

export default async function NewCategoryPage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nueva categoría</h1>
        <p className="text-sm text-muted-foreground">Crear una nueva categoría de productos</p>
      </div>
      <CategoryForm />
    </div>
  )
}
