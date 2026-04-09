import { getProductBySlug, getProductsByCategory } from "@/services/products"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PriceDisplay } from "@/components/store/price-display"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { WishlistButton } from "@/components/store/wishlist-button"
import { QuantitySelector } from "@/components/store/quantity-selector"
import { ProductCarousel } from "@/components/store/product-carousel"

export default async function ProductDetailPage(
  { params }: { params: Promise<{ category: string, slug: string }> }
) {
  const resolvedParams = await params
  const { slug } = resolvedParams
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getProductsByCategory(product.category?.slug || resolvedParams.category)
  
  const mainImage = product.images.find(img => img.isMain) || product.images[0]
  const defaultVariant = product.variants[0]
  const name = product.name.es

  return (
    <div className="container px-4 py-8">
      <Breadcrumbs items={[
        { label: "Productos", href: "/productos" },
        { label: product.category?.name?.es || resolvedParams.category, href: `/productos/${resolvedParams.category}` },
        { label: name }
      ]} />
      
      {/* Product Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 mb-16 lg:gap-16">
        
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl border bg-muted/20 overflow-hidden">
             {mainImage ? (
                <Image 
                  src={mainImage.url} 
                  alt={mainImage.alt || name}
                  fill
                  className="object-contain p-8"
                  priority
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sin Imagen</div>
             )}
          </div>
          
          {/* Thumbnails if > 1 */}
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map(img => (
                <div key={img.id} className={`relative w-20 h-20 shrink-0 rounded-md border cursor-pointer ${img.isMain ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                  <Image src={img.url} alt={img.alt || name} fill className="object-contain p-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="text-sm text-primary font-semibold mb-2">{product.category?.name?.es}</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{name}</h1>
            <p className="text-muted-foreground mt-4 leading-relaxed">{product.description?.es}</p>
          </div>

          <div className="flex items-center justify-between border-y py-6">
            <PriceDisplay externalCode={defaultVariant?.externalCode} className="text-2xl" />
            <div className="flex gap-3">
              <WishlistButton product={product} className="border" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
               {/* Note: In a real detail page we might have local state for quantity to pass to AddToCartButton, 
                   but we can mock it here or just add 1 */}
               <AddToCartButton product={product} variant={defaultVariant} className="flex-1 text-lg py-6" />
            </div>
            
            {(defaultVariant?.externalCode?.metadata as any)?.stock > 0 ? (
               <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-600"></span>
                 En stock ({(defaultVariant.externalCode?.metadata as any).stock} uds)
               </div>
            ) : (
               <div className="text-sm font-medium flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                 Consultar disponibilidad
               </div>
            )}
          </div>

          <div className="mt-4 pt-6 border-t space-y-4 text-sm text-muted-foreground">
            {defaultVariant?.sku && (
              <p>SKU: <span className="text-foreground">{defaultVariant.sku}</span></p>
            )}
            {/* Payment & Shipping info mock */}
            <div className="flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M2 12h20"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/><path d="M4 12v-2a4 4 0 0 1 8 0v2"/><path d="M20 12v-2a4 4 0 0 0-8 0v2"/></svg>
              <span>Envío disponible a todo el país.</span>
            </div>
            <div className="flex gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>Garantía oficial Interbras.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs / Detailed specs */}
      <div className="mt-16 border-t pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {product.specs?.['es'] && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Especificaciones Técnicas</h3>
              <div className="divide-y border-y">
                {product.specs['es'].map((spec, i) => (
                  <div key={i} className="flex py-3 gap-4">
                    <span className="w-1/3 text-muted-foreground font-medium">{spec.label}</span>
                    <span className="w-2/3">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {product.included?.['es'] && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Qué incluye la caja</h3>
              <div className="prose text-muted-foreground">
                <p>{product.included['es']}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Productos Relacionados</h2>
          <ProductCarousel products={relatedProducts.filter(p => p.id !== product.id)} />
        </div>
      )}
    </div>
  )
}
