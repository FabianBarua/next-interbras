"use client"

import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import { forwardRef } from "react"
import { InterbrasLogo } from "@/components/store/interbras-logo"
import { MiniProductStrip, type MiniProduct } from "./mini-product-strip"

interface Props {
  siteName?: string
  productCount?: number
  categoryCount?: number
  sampleProducts?: MiniProduct[]
}

/**
 * Cover page for the PDF catalog.
 * Full-width (no maxWidth cap) so it matches the section cards width.
 * No overflow-hidden on outer wrapper to avoid capture clipping.
 */
export const CoverPage = forwardRef<HTMLDivElement, Props>(function CoverPage(
  { siteName = "Interbras", productCount, categoryCount, sampleProducts = [] },
  ref,
) {
  const { locale } = useDictionary()
  const cover = useCatalogStore((s) => s.coverImageDataUrl)
  const title = useCatalogStore((s) => s.coverTitle) || (locale === "pt" ? "Catálogo de Produtos" : "Catálogo de Productos")
  const subtitle = useCatalogStore((s) => s.coverSubtitle)
  const year = new Date().getFullYear()

  return (
    <div
      ref={ref}
      data-export-label="cover"
      className="w-full rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-t-2xl bg-linear-to-r from-brand-500 to-brand-600 px-10 py-6">
        <InterbrasLogo className="h-4 text-white dark:text-white" />
        <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90">
         Catalogo · {year}
        </span>
      </div>

      {/* Hero */}
      <div className="relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="relative h-72 w-full overflow-hidden bg-linear-to-br from-brand-500/5 via-brand-500/10 to-brand-500/15">
            {/* Dot pattern background */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            {/* Mini product cards strip */}
            <MiniProductStrip products={sampleProducts} />
          </div>
        )}
        {/* Fade to white at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-card to-transparent" />
      </div>

      {/* Title block */}
      <div className="px-10 pb-10 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1 w-10 rounded-full bg-brand-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
            {locale === "pt" ? "Catálogo oficial" : "Catálogo oficial"}
          </span>
        </div>
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
        )}

        {/* Stats row */}
        {(productCount !== undefined || categoryCount !== undefined) && (
          <div className="mt-8 flex gap-10 border-t border-border/60 pt-6">
            {productCount !== undefined && (
              <div>
                <p className="text-4xl font-black text-brand-600">{productCount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {locale === "pt" ? "Produtos" : "Productos"}
                </p>
              </div>
            )}
            {categoryCount !== undefined && (
              <div>
                <p className="text-4xl font-black text-foreground">{categoryCount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {locale === "pt" ? "Categorias" : "Categorías"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
