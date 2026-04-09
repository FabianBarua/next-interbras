import { requireAdmin } from "@/lib/auth/get-session"
import { getProductByIdAdmin } from "@/services/admin/products"
import { getVariantById } from "@/services/admin/variants"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { VariantEditClient } from "./client"

export default async function VariantEditPage({ params }: { params: Promise<{ id: string; variantId: string }> }) {
  await requireAdmin()
  const { id, variantId } = await params
  const [product, variant, attributeDefs] = await Promise.all([
    getProductByIdAdmin(id),
    getVariantById(variantId),
    getAttributesWithValues(),
  ])
  if (!product || !variant) notFound()

  return (
    <VariantEditClient
      productId={id}
      productName={product.name.es ?? product.slug}
      variant={variant}
      attributeDefs={attributeDefs}
    />
  )
}
