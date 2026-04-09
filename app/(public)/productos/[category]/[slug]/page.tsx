import { getProductBySlug, getProductsByCategory } from "@/services/products"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductGallery } from "@/components/store/product-gallery"
import { Separator } from "@/components/ui/separator"

export default async function ProductDetailPage(
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { slug, category: catSlug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const relatedProducts = (await getProductsByCategory(product.category?.slug || catSlug))
    .filter((p) => p.id !== product.id)

  const v = product.variants[0]
  const name = product.name.es
  const stock = (v?.externalCode?.metadata as any)?.stock

  return (
    <div className="container px-4 py-6">
      <Breadcrumbs items={[
        { label: "Productos", href: "/productos" },
        { label: product.category?.name?.es || catSlug, href: `/productos/${catSlug}` },
        { label: name },
      ]} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_340px] gap-6 lg:gap-10 mt-6">
        {/* Gallery */}
        <ProductGallery images={product.images} alt={name} />

        {/* Info — sticky sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-5">
          {/* Category + Name */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
              {product.category?.name?.es}
            </p>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{name}</h1>
            {v?.sku && (
              <p className="text-xs text-muted-foreground mt-1.5">SKU: {v.sku}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end justify-between gap-4">
            <PriceDisplay externalCode={v?.externalCode} className="text-xl" />
            {stock > 0 ? (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Stock: {stock}
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Consultar
              </span>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <AddToCartButton product={product} variant={v} className="flex-1 py-3 text-sm" />
            <WishlistButton product={product} className="border h-11 w-11 shrink-0" />
          </div>

          {/* Description */}
          {product.description?.es && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description.es}
            </p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <TrustBadge
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
              text="Envío a todo el país"
            />
            <TrustBadge
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>}
              text="Garantía Interbras"
            />
            <TrustBadge
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>}
              text="Todas las tarjetas"
            />
            <TrustBadge
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>}
              text="Retiro en tienda"
            />
          </div>
        </div>
      </div>

      {/* Specs + Included */}
      {(product.specs?.["es"] || product.included?.["es"]) && (
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {product.specs?.["es"] && (
              <div>
                <h3 className="text-lg font-bold mb-4">Especificaciones</h3>
                <div className="divide-y text-sm">
                  {product.specs["es"].map((spec, i) => (
                    <div key={i} className="flex py-2.5 gap-4">
                      <span className="w-2/5 text-muted-foreground">{spec.label}</span>
                      <span className="w-3/5 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {product.included?.["es"] && (
              <div>
                <h3 className="text-lg font-bold mb-4">Contenido de la Caja</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.included["es"]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <h2 className="text-sm font-bold tracking-tight mb-4 uppercase text-muted-foreground">Productos Relacionados</h2>
          <ProductCarousel products={relatedProducts} compact />
        </div>
      )}
    </div>
  )
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2.5 rounded-lg bg-muted/40 border border-transparent">
      <span className="text-primary shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
