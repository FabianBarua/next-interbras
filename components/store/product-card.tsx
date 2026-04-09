import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types/product"
import { PriceDisplay } from "./price-display"
import { WishlistButton } from "./wishlist-button"
import { Badge } from "@/components/ui/badge"

export function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images.find(img => img.isMain) || product.images[0]
  const defaultVariant = product.variants[0]
  const productName = product.name?.es || product.name?.pt || "Producto"
  const categoryName = product.category?.name?.es || ""

  return (
    <div className="group relative flex flex-col rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 overflow-hidden">
      <Link href={`/productos/${product.category?.slug || 'other'}/${product.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver {productName}</span>
      </Link>

      {/* Image area */}
      <div className="relative aspect-square w-full bg-muted/30 dark:bg-muted/10">
        <div className="absolute top-3 right-3 z-20">
          <WishlistButton product={product} />
        </div>

        {/* Category badge — visible on hover */}
        {categoryName && (
          <div className="absolute bottom-3 left-3 z-20 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
              {categoryName}
            </Badge>
          </div>
        )}

        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={mainImage.alt || productName}
            fill
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <h3 className="font-medium text-sm leading-snug text-foreground line-clamp-2">
          {productName}
        </h3>

        <div className="mt-auto pt-3">
          <PriceDisplay externalCode={defaultVariant?.externalCode} />
        </div>
      </div>
    </div>
  )
}
