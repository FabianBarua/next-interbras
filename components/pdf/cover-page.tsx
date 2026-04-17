"use client"

import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import { forwardRef } from "react"
import { InterbrasLogo } from "@/components/store/interbras-logo"

interface Props {
  siteName?: string
  productCount?: number
  categoryCount?: number
}

/**
 * Cover page for the PDF catalog.
 * Full-width (no maxWidth cap) so it matches the section cards width.
 * No overflow-hidden on outer wrapper to avoid capture clipping.
 */
export const CoverPage = forwardRef<HTMLDivElement, Props>(function CoverPage(
  { siteName = "Interbras", productCount, categoryCount },
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
      className="w-full rounded-2xl border border-border bg-white shadow-sm"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-t-2xl bg-brand-600 px-10 py-5">
        <InterbrasLogo className="h-5 w-auto text-white" />
        <span className="text-xs font-medium uppercase tracking-widest text-white/70">
          {siteName} · {year}
        </span>
      </div>

      {/* Hero */}
      <div className="relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-64 w-full object-cover"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-linear-to-br from-brand-100 via-brand-200 to-brand-300">
            <InterbrasLogo className="h-12 w-auto text-brand-500/40" />
          </div>
        )}
        {/* Fade to white at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent" />
      </div>

      {/* Title block */}
      <div className="px-10 pb-8 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-brand-500" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
            {locale === "pt" ? "Catálogo oficial" : "Catálogo oficial"}
          </span>
        </div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-base text-slate-500">{subtitle}</p>
        )}

        {/* Stats row */}
        {(productCount !== undefined || categoryCount !== undefined) && (
          <div className="mt-6 flex gap-8 border-t border-border/60 pt-5">
            {productCount !== undefined && (
              <div>
                <p className="text-3xl font-black text-brand-600">{productCount}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {locale === "pt" ? "Produtos" : "Productos"}
                </p>
              </div>
            )}
            {categoryCount !== undefined && (
              <div>
                <p className="text-3xl font-black text-slate-700">{categoryCount}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
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
