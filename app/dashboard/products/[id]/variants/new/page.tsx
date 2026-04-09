import { requireAdmin } from "@/lib/auth/get-session"
import { getProductByIdAdmin } from "@/services/admin/products"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { VariantCreateClient } from "./client"

export default async function VariantCreatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [product, attributeDefs] = await Promise.all([
    getProductByIdAdmin(id),
    getAttributesWithValues(),
  ])
  if (!product) notFound()

  return <VariantCreateClient productId={id} productName={product.name.es ?? product.slug} attributeDefs={attributeDefs} />
}
