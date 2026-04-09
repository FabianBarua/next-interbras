import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types/product"
import { PriceDisplay } from "./price-display"
import { WishlistButton } from "./wishlist-button"

export function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images.find(img => img.isMain) || product.images[0]
  const defaultVariant = product.variants[0]
  const productName = product.name?.es || product.name?.pt || "Producto"

  return (
    <div className="group relative flex flex-col rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-300 overflow-hidden">
      <Link href={`/productos/${product.category?.slug || 'other'}/${product.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver {productName}</span>
      </Link>

      {/* Image area */}
      <div className="relative aspect-[4/3] w-full bg-muted/20 dark:bg-muted/10">
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton product={product} />
        </div>

        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={mainImage.alt || productName}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <h3 className="font-medium text-xs leading-snug text-foreground line-clamp-2">
          {productName}
        </h3>

        <div className="mt-auto pt-1.5">
          <PriceDisplay externalCode={defaultVariant?.externalCode} />
        </div>
      </div>
    </div>
  )
}
