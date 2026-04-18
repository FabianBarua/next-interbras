"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { VariantEditor } from "@/components/dashboard/form/variant-editor"
import type { AttrDef } from "@/components/dashboard/form/attribute-pickers"
import type { AdminVariant } from "@/services/admin/variants"

export function VariantEditClient({
  variant,
  productId,
  productName,
  productSlug,
  attributeDefs,
}: {
  variant: AdminVariant
  productId: string
  productName: string
  productSlug: string
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const variantsHref = `/dashboard/variants?productId=${productId}`

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Variantes", href: "/dashboard/variants" },
          { label: productName, href: variantsHref },
          { label: variant.externalCode?.code ?? variant.id.slice(0, 8) },
        ]}
      />
      <PageHeader
        label={`Editar variante`}
        action={
          <Link
            href={`/dashboard/products/${productId}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            Ver producto «{productSlug}»
          </Link>
        }
      >
        Producto: {productName}
      </PageHeader>

      <VariantEditor
        productId={productId}
        attributeDefs={attributeDefs}
        variant={variant}
        onDone={() => router.refresh()}
        onCancel={() => router.push(variantsHref)}
        showHeader={false}
        highlight="none"
      />
    </div>
  )
}
