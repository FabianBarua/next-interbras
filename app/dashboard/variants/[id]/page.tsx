import { requireAdmin } from "@/lib/auth/get-session"
import { notFound } from "next/navigation"
import { getVariantById } from "@/services/admin/variants"
import { getProductByIdAdmin } from "@/services/admin/products"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { VariantEditClient } from "./client"

export default async function VariantEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const variant = await getVariantById(id)
  if (!variant) notFound()

  const [product, attributeDefs] = await Promise.all([
    getProductByIdAdmin(variant.productId),
    getAttributesWithValues(),
  ])
  if (!product) notFound()

  return (
    <VariantEditClient
      variant={variant}
      productId={product.id}
      productName={product.name.es ?? product.slug}
      productSlug={product.slug}
      attributeDefs={attributeDefs}
    />
  )
}
