"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProductPicker, type ProductPickerItem } from "@/components/dashboard/product-picker"
import { VariantEditor } from "@/components/dashboard/form/variant-editor"
import type { AttrDef } from "@/components/dashboard/form/attribute-pickers"
import { Field } from "@/components/dashboard/form/primitives"

export function VariantCreateClient({
  attributeDefs,
  initialProduct,
}: {
  attributeDefs: AttrDef[]
  initialProduct: ProductPickerItem | null
}) {
  const router = useRouter()
  const [product, setProduct] = React.useState<ProductPickerItem | null>(initialProduct)

  const variantsHref = product
    ? `/dashboard/variants?productId=${product.id}`
    : "/dashboard/variants"

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Variantes", href: "/dashboard/variants" },
          { label: "Nueva" },
        ]}
      />
      <PageHeader label="Nueva variante">
        {product ? `Producto: ${product.name}` : "Seleccioná un producto"}
      </PageHeader>

      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <Field label="Producto" required hint="La variante pertenece a este producto.">
          <ProductPicker
            value={product?.id ?? null}
            onChange={(_id, item) => setProduct(item)}
            initialItem={product}
            placeholder="Buscá y seleccioná un producto…"
            buttonClassName="w-full sm:w-96"
          />
        </Field>
      </div>

      {product ? (
        <VariantEditor
          key={product.id}
          productId={product.id}
          attributeDefs={attributeDefs}
          onDone={() => router.push(variantsHref)}
          onCancel={() => router.push(variantsHref)}
          showHeader={false}
          highlight="create"
        />
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Seleccioná un producto arriba para empezar.
        </div>
      )}
    </div>
  )
}
