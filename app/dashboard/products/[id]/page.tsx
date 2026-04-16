import { requireAdmin } from "@/lib/auth/get-session"
import { getProductByIdAdmin } from "@/services/admin/products"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { getAllVariantsForProduct } from "@/services/admin/variants"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { ProductEditForm } from "./edit-form"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [product, categories, variants, attributeDefs] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategoriesAdmin(),
    getAllVariantsForProduct(id),
    getAttributesWithValues(),
  ])
  if (!product) notFound()

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Productos", href: "/dashboard/products" },
        { label: product.name.es ?? product.slug },
      ]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Editar: {product.name.es ?? product.slug}</h1>
        <a href={`/dashboard/products/${id}/variants`} className="h-9 px-4 border text-sm font-medium rounded-lg hover:bg-muted inline-flex items-center gap-2">
          Variantes →
        </a>
      </div>
      <ProductEditForm product={product} categories={categories} variants={variants} attributeDefs={attributeDefs} />
    </div>
  )
}
