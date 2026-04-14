import { getProductByVariantSlug, getProductsByCategory } from "@/services/products"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductDetailView } from "@/components/store/product-detail-view"
import { ProductCTA } from "@/components/store/product-cta"
import { ProductTabs } from "@/components/store/product-tabs"
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
    <div className="container px-4 py-6 max-w-6xl mx-auto">
      <Breadcrumbs items={[
        { label: dict.nav.products, href: "/productos" },
        { label: product.category?.name?.[locale] || product.category?.name?.es || catSlug, href: `/productos/${catSlug}` },
        { label: name },
      ]} />

      {/* Main product section */}
      <div className="mt-6">
        <ProductDetailView product={product} initialVariantId={variant?.id} categorySlug={catSlug} />
      </div>

      {/* Product tabs: Description, Specs, Included */}
      <ProductTabs product={product} />

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-bold tracking-tight mb-4 uppercase text-muted-foreground">{dict.products.relatedProducts}</h2>
          <ProductCarousel products={relatedProducts} compact />
        </div>
      )}

      {/* CTA */}
      <ProductCTA />
    </div>
  )
}
