"use client"
import * as React from "react"
import { ProductCard } from "./product-card"
import type { Product } from "@/types/product"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export function ProductCarousel({ products, compact }: { products: Product[]; compact?: boolean }) {
  if (!products || products.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden px-0 group">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-3">
          {products.map((product) => (
            <CarouselItem key={product.id} className={`pl-2 md:pl-3 ${compact ? 'basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5' : 'basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4'}`}>
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </div>
      </Carousel>
    </div>
  )
}
