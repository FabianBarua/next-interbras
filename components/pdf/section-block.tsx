"use client"

import type { RenderedSection, CurrencyCode, RenderedItem } from "@/lib/pdf/types"
import { getSectionColor } from "@/lib/pdf/constants"
import { ProductGrid } from "./product-grid"
import { Button } from "@/components/ui/button"
import { PencilSimple, Plus } from "@phosphor-icons/react"
import { useDictionary } from "@/i18n/context"
import { cn } from "@/lib/utils"
import * as PhIcons from "@phosphor-icons/react"
import type { ComponentType } from "react"

type PhIconComponent = ComponentType<{ className?: string; weight?: "regular" | "fill" }>
const phIconMap = PhIcons as unknown as Record<string, PhIconComponent>

interface Props {
  section: RenderedSection
  currency: CurrencyCode
  showPrices: boolean
  editable: boolean
  columns: number
  hiddenEntryIds: Set<string>
  overrideIds: Set<string>
  onToggleEntryHidden: (entryId: string) => void
  onEditItem: (item: RenderedItem) => void
  onResetOverride: (entryId: string) => void
  onEditSection?: () => void
  onAddProducts?: () => void
}

/**
 * A single catalog section (category or custom) rendered as a card.
 * Reordering and hiding are handled in the "Manage sections" dialog,
 * so this component is no longer draggable and has no hide/drag UI.
 */
export function SectionBlock({
  section,
  currency,
  showPrices,
  editable,
  columns,
  hiddenEntryIds,
  overrideIds,
  onToggleEntryHidden,
  onEditItem,
  onResetOverride,
  onEditSection,
  onAddProducts,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const color = getSectionColor(section.color)
  const isCategory = section.kind === "category"

  const PhosphorIcon = section.icon ? phIconMap[section.icon] : null

  return (
    <section
      data-export-label={section.name}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs"
    >
      {/* Header */}
      <header
        className={cn(
          "flex items-start gap-3 px-5 py-4",
          isCategory
            ? "border-b border-brand-700/20 bg-linear-to-r from-brand-500 to-brand-600 text-white"
            : "border-b",
        )}
        style={
          !isCategory
            ? { backgroundColor: color.bg, color: color.fg, borderColor: `${color.hex}33` }
            : undefined
        }
      >
        {/* Icon slot */}
        {isCategory && section.svgIcon ? (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white [&_svg]:h-5 [&_svg]:w-5"
            dangerouslySetInnerHTML={{ __html: section.svgIcon }}
          />
        ) : PhosphorIcon ? (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={
              isCategory
                ? undefined
                : { backgroundColor: color.hex, color: "#fff" }
            }
          >
            <PhosphorIcon
              className={cn("h-5 w-5", isCategory && "text-white")}
              weight="fill"
            />
          </span>
        ) : isCategory ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base font-black text-white">
            {section.name.charAt(0)}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight tracking-tight">
            {section.name}
          </h2>
          {section.description && (
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-[12px] leading-snug",
                isCategory ? "text-white/85" : "opacity-75",
              )}
            >
              {section.description}
            </p>
          )}
          <p
            className={cn(
              "mt-1 text-[10px] font-semibold uppercase tracking-wider",
              isCategory ? "text-white/70" : "opacity-70",
            )}
          >
            {section.items.length} {t.products}
          </p>
        </div>

        {editable && !isCategory && (
          <div data-pdf-hide className="flex shrink-0 items-center gap-1">
            {onAddProducts && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-black/10"
                onClick={onAddProducts}
                style={{ color: color.fg }}
              >
                <Plus className="h-3.5 w-3.5" />
                {t.addProducts}
              </Button>
            )}
            {onEditSection && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-black/10"
                onClick={onEditSection}
                style={{ color: color.fg }}
                title={t.editSection}
              >
                <PencilSimple className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="p-4">
        {section.items.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground">
            {t.emptyCustomSection}
          </div>
        ) : (
          <ProductGrid
            items={section.items}
            currency={currency}
            showPrices={showPrices}
            editable={editable}
            columns={columns}
            hiddenIds={hiddenEntryIds}
            overrideIds={overrideIds}
            onToggleHidden={onToggleEntryHidden}
            onEdit={onEditItem}
            onResetOverride={onResetOverride}
          />
        )}
      </div>
    </section>
  )
}
