"use client"

import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Fancybox } from "@fancyapps/ui"
import "@fancyapps/ui/dist/fancybox/fancybox.css"
import type { Variant } from "@/types/product"
import { getVariantImages } from "@/lib/variant-images"
import { useDictionary } from "@/i18n/context"

export function ProductGallery({ variant, alt }: { variant?: Variant; alt: string }) {
  const { dict } = useDictionary()
  const pool = getVariantImages(variant)

  const sorted = [...pool].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1
    if (!a.isMain && b.isMain) return 1
    return a.sortOrder - b.sortOrder
  })

  const [selected, setSelected] = useState(0)
  const galleryRef = useRef<HTMLDivElement>(null)

  // Reset selection when variant changes
  useEffect(() => {
    setSelected(0)
  }, [variant?.id])

  useEffect(() => {
    const container = galleryRef.current
    if (!container) return
    Fancybox.bind(container, "[data-fancybox='gallery']", {
      showClass: "f-zoomInUp",
      hideClass: "f-zoomOutDown",
      Toolbar: { display: { left: [], middle: [], right: ["close"] } },
      Images: {
        zoom: true,
        Panzoom: { maxScale: 1 },
        initialSize: "fit",
      },
    } as any)
    return () => {
      Fancybox.unbind(container)
      Fancybox.close()
    }
  }, [])

  if (sorted.length === 0) {
    return (
      <div className="aspect-square max-w-md rounded-xl border bg-muted/20 flex items-center justify-center text-muted-foreground text-sm">
        {dict.products.noImage}
      </div>
    )
  }

  return (
    <div className=" max-w-sm w-full" ref={galleryRef}>
      {/* Main image */}
      <a
        href={sorted[selected].url}
        data-fancybox="gallery"
        data-caption={alt}
        className="block relative aspect-square p-9 rounded-xl border bg-muted/5 overflow-hidden cursor-zoom-in group"
      >
        <Image
          src={sorted[selected].url}
          alt={sorted[selected].alt || alt}
          fill
          className="object-contain p-12 transition-transform duration-300 group-hover:scale-[1.03]"
          priority
          sizes="(max-width: 768px) 100vw, 500px"
        />
        <span className="absolute bottom-2.5 right-2.5 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] text-muted-foreground font-medium border opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
          {dict.products.zoom}
        </span>
      </a>

      {/* Hidden links for other images so Fancybox can navigate them */}
      {sorted.map((img, idx) =>
        idx !== selected ? (
          <a key={img.id} href={img.url} data-fancybox="gallery" data-caption={img.alt || alt} className="hidden" />
        ) : null
      )}

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelected(idx)}
              className={`relative w-14 h-14 shrink-0 rounded-md border-2 overflow-hidden transition-all ${
                idx === selected
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <Image src={img.url} alt={img.alt || alt} fill className="object-contain p-0.5" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
