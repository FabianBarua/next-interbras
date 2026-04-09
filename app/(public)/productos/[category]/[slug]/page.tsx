import { getProductBySlug, getProductsByCategory } from "@/services/products"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductGallery } from "@/components/store/product-gallery"
import { ProductInfo } from "@/components/store/product-info"

export default async function ProductDetailPage(
  { params, searchParams }: {
    params: Promise<{ category: string; slug: string }>
    searchParams: Promise<{ v?: string }>
  }
) {
  const { slug, category: catSlug } = await params
  const { v: variantId } = await searchParams
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const relatedProducts = (await getProductsByCategory(product.category?.slug || catSlug))
    .filter((p) => p.id !== product.id)

  const name = product.name.es

  return (
    <div className="container px-4 py-6 max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: "Productos", href: "/productos" },
        { label: product.category?.name?.es || catSlug, href: `/productos/${catSlug}` },
        { label: name },
      ]} />

      {/* Main grid — centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mt-6">
        {/* Gallery */}
        <ProductGallery images={product.images} alt={name} />

        {/* Info */}
        <div className="md:sticky md:top-24 h-fit">
          <ProductInfo product={product} initialVariantId={variantId} />
        </div>
      </div>

      {/* Specs + Included */}
      {(product.specs?.["es"] || product.included?.["es"]) && (
        <div className="mt-10 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.specs?.["es"] && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Especificaciones</h3>
                <div className="divide-y text-sm">
                  {product.specs["es"].map((spec, i) => (
                    <div key={i} className="flex py-2 gap-4">
                      <span className="w-2/5 text-muted-foreground text-xs">{spec.label}</span>
                      <span className="w-3/5 font-medium text-xs">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {product.included?.["es"] && (
              <div>
                <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground">Contenido de la Caja</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {product.included["es"]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs font-bold tracking-tight mb-4 uppercase text-muted-foreground">Productos Relacionados</h2>
          <ProductCarousel products={relatedProducts} compact />
        </div>
      )}
    </div>
  )
}
