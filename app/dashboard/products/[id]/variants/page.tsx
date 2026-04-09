import { requireAdmin } from "@/lib/auth/get-session"
import { getProductByIdAdmin } from "@/services/admin/products"
import { getAllVariantsForProduct } from "@/services/admin/variants"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { VariantsTable } from "./table"

export default async function VariantesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [product, variants] = await Promise.all([
    getProductByIdAdmin(id),
    getAllVariantsForProduct(id),
  ])
  if (!product) notFound()

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Productos", href: "/dashboard/products" },
        { label: product.name.es ?? product.slug, href: `/dashboard/products/${id}` },
        { label: "Variantes" },
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Variantes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Producto: <strong>{product.name.es ?? product.slug}</strong> · {variants.length} variante{variants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${id}/variants/new?mode=bulk`} className="h-9 px-4 border text-sm font-medium rounded-lg hover:bg-muted inline-flex items-center">
            + Agregar múltiples
          </Link>
          <Link href={`/dashboard/products/${id}/variants/new`} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 inline-flex items-center">
            + Nueva variante
          </Link>
        </div>
      </div>
      <VariantsTable productId={id} initialVariants={variants} />
    </div>
  )
}
