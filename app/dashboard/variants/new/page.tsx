import { requireAdmin } from "@/lib/auth/get-session"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { getProductLabelAction } from "@/lib/actions/admin/products"
import { VariantCreateClient } from "./client"

export default async function VariantCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const productId =
    typeof sp.productId === "string" && sp.productId ? sp.productId : null

  const [attributeDefs, initialProduct] = await Promise.all([
    getAttributesWithValues(),
    productId ? getProductLabelAction(productId) : Promise.resolve(null),
  ])

  return (
    <VariantCreateClient
      attributeDefs={attributeDefs}
      initialProduct={initialProduct}
    />
  )
}
