"use client"

import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { VariantEditor } from "@/components/dashboard/form/variant-editor"
import type { AttrDef } from "@/components/dashboard/form/attribute-pickers"

export function VariantCreateClient({
  productId,
  productName,
  attributeDefs,
}: {
  productId: string
  productName: string
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const variantsHref = `/dashboard/products/${productId}/variants`

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Productos", href: "/dashboard/products" },
          { label: productName, href: `/dashboard/products/${productId}` },
          { label: "Variantes", href: variantsHref },
          { label: "Nueva" },
        ]}
      />
      <PageHeader label="Nueva variante">Producto: {productName}</PageHeader>

      <VariantEditor
        productId={productId}
        attributeDefs={attributeDefs}
        onDone={() => router.push(variantsHref)}
        onCancel={() => router.push(variantsHref)}
        showHeader={false}
        highlight="create"
      />
    </div>
  )
}
