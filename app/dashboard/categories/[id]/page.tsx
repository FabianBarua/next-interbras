import { requireAdmin } from "@/lib/auth/get-session"
import { getCategoryByIdAdmin } from "@/services/admin/categories"
import { notFound } from "next/navigation"
import { CategoryForm } from "@/components/dashboard/forms/category-form"

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const category = await getCategoryByIdAdmin(id)
  if (!category) notFound()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar categoría</h1>
        <p className="text-sm text-muted-foreground">{category.name.es || category.slug}</p>
      </div>
      <CategoryForm category={category} />
    </div>
  )
}
