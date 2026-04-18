"use client"

import { useRouter } from "next/navigation"
import type { AdminVariant } from "@/services/admin/variants"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { VariantEditor } from "@/components/dashboard/form/variant-editor"
import type { AttrDef } from "@/components/dashboard/form/attribute-pickers"

export function VariantEditClient({
  productId,
  productName,
  variant,
  attributeDefs,
}: {
  productId: string
  productName: string
  variant: AdminVariant
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const code = variant.externalCode?.code ?? "(sin código)"
  const variantsHref = `/dashboard/products/${productId}/variants`

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Productos", href: "/dashboard/products" },
          { label: productName, href: `/dashboard/products/${productId}` },
          { label: "Variantes", href: variantsHref },
          { label: code },
        ]}
      />
      <PageHeader label={`Editar: ${code}`}>
        Producto: {productName}
      </PageHeader>

      <VariantEditor
        productId={productId}
        attributeDefs={attributeDefs}
        variant={variant}
        onDone={() => {
          router.refresh()
        }}
        onCancel={() => router.push(variantsHref)}
        highlight="none"
        showHeader={false}
      />
    </div>
  )
}
