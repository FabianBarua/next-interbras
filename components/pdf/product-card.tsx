"use client"

import { memo } from "react"
import type { RenderedItem, CurrencyCode } from "@/lib/pdf/types"
import { PriceDisplay } from "./price-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PencilSimple, Eye, EyeSlash, ArrowClockwise } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/i18n/context"

interface Props {
  item: RenderedItem
  currency: CurrencyCode
  showPrices: boolean
  isHidden: boolean
  /** Whether we're in edit mode (show action buttons). */
  editable: boolean
  onToggleHidden?: () => void
  onEdit?: () => void
  onResetOverride?: () => void
  hasOverride?: boolean
}

function ProductCardImpl({
  item,
  currency,
  showPrices,
  isHidden,
  editable,
  onToggleHidden,
  onEdit,
  onResetOverride,
  hasOverride,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog

  const specsArray = (() => {
    const raw =
      typeof item.specs === "string"
        ? item.specs
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((line) => {
              const idx = line.indexOf(":")
              if (idx > 0)
                return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
              return { label: "", value: line }
            })
        : item.specs
    if (!raw || raw.length === 0) return raw
    // Sort by total character length, keep the 5 shortest
    return [...raw]
      .sort((a, b) => {
        const la = (a.label?.length ?? 0) + a.value.length
        const lb = (b.label?.length ?? 0) + b.value.length
        return la - lb
      })
      .slice(0, 5)
  })()

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition",
        isHidden
          ? "border-dashed border-border/50 opacity-40 saturate-0"
          : "border-border/60 hover:border-brand-500/40 hover:shadow-sm",
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-muted/30">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            crossOrigin="anonymous"
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {item.code}
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {item.promo && (
            <Badge variant="default" className="bg-amber-500 text-xs text-white hover:bg-amber-500">
              {t.badgePromo}
            </Badge>
          )}
          {isHidden && (
            <Badge variant="outline" className="bg-white/80 text-xs">
              {t.productHidden}
            </Badge>
          )}
        </div>

        {/* Edit mode toolbar */}
        {editable && (
          <div data-pdf-hide className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
            {onEdit && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-md shadow-sm"
                onClick={onEdit}
                title={t.editProduct}
              >
                <PencilSimple className="h-3.5 w-3.5" />
              </Button>
            )}
            {hasOverride && onResetOverride && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-md shadow-sm"
                onClick={onResetOverride}
                title={t.resetProduct}
              >
                <ArrowClockwise className="h-3.5 w-3.5" />
              </Button>
            )}
            {onToggleHidden && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-md shadow-sm"
                onClick={onToggleHidden}
                title={isHidden ? t.showProduct : t.hideProduct}
              >
                {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeSlash className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            {item.name}
          </p>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.code}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {item.voltage && (
            <span className="inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
              {item.voltage}
            </span>
          )}
          {item.qtyPerBox !== null && (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
              {t.qtyPerBox}: {item.qtyPerBox}
            </span>
          )}
        </div>

        {/* Specs */}
        {specsArray && specsArray.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {specsArray.slice(0, 5).map((s, i) => (
              <li key={i} className="flex flex-wrap gap-x-1.5">
                {s.label && <span className="shrink-0 font-medium text-foreground/80">{s.label}:</span>}
                <span className="wrap-break-word">{s.value}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        <div className="mt-auto pt-2">
          <PriceDisplay
            value={item.price}
            currency={currency}
            show={showPrices}
            className="text-base text-brand-700"
          />
        </div>
      </div>
    </div>
  )
}

export const ProductCard = memo(ProductCardImpl)
