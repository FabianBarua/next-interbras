import { getProductByVariantSlug, getProductsByCategory } from "@/services/products"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductDetailView } from "@/components/store/product-detail-view"
import { ProductCTA } from "@/components/store/product-cta"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"

export default async function ProductDetailPage(
  { params }: {
    params: Promise<{ category: string; slug: string }>
  }
) {
  const { slug, category: catSlug } = await params
  const entry = await getProductByVariantSlug(slug)
  if (!entry) notFound()

  const { product, variant } = entry
  const dict = await getDictionary()
  const locale = await getLocale()

  const relatedProducts = (await getProductsByCategory(product.category?.slug || catSlug))
    .filter((p) => p.id !== product.id)

  const name = product.name[locale] || product.name.es

  return (
    <div className="container px-4 py-6 max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: dict.nav.products, href: "/productos" },
        { label: product.category?.name?.[locale] || product.category?.name?.es || catSlug, href: `/productos/${catSlug}` },
        { label: name },
      ]} />

      {/* Main grid — centered */}
      <div className="mt-6">
        <ProductDetailView product={product} initialVariantId={variant?.id} categorySlug={catSlug} />
      </div>

      {/* Specs + Included */}
      {(product.specs?.[locale] || product.specs?.["es"] || product.included?.[locale] || product.included?.["es"]) && (
        <div className="mt-10 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {(product.specs?.[locale] || product.specs?.["es"]) && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">{dict.products.specs}</h3>
                <div className="divide-y text-sm">
                  {(product.specs[locale] || product.specs["es"])!.map((spec, i) => (
                    <div key={i} className="flex py-2 gap-4">
                      <span className="w-2/5 text-muted-foreground text-xs">{spec.label}</span>
                      <span className="w-3/5 font-medium text-xs">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(product.included?.[locale] || product.included?.["es"]) && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">{dict.products.boxContents}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {product.included[locale] || product.included["es"]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs font-bold tracking-tight mb-4 uppercase text-muted-foreground">{dict.products.relatedProducts}</h2>
          <ProductCarousel products={relatedProducts} compact />
        </div>
      )}

      {/* CTA */}
      <ProductCTA />
    </div>
  )
}
