"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { RenderedSection, CurrencyCode, RenderedItem } from "@/lib/pdf/types"
import { getSectionColor } from "@/lib/pdf/constants"
import { ProductGrid } from "./product-grid"
import { Button } from "@/components/ui/button"
import {
  DotsSixVertical,
  PencilSimple,
  Plus,
  EyeSlash,
} from "@phosphor-icons/react"
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
  onHideSection?: () => void
  onEditSection?: () => void
  onAddProducts?: () => void
  /** Draggable via this id (only used for custom sections + categories). */
  sortableId: string
  /** Whether the section can be reordered. */
  sortable: boolean
}

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
  onHideSection,
  onEditSection,
  onAddProducts,
  sortableId,
  sortable,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const color = getSectionColor(section.color)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: !sortable || !editable })

  const Icon = section.icon ? phIconMap[section.icon] : null

  return (
    <section
      ref={setNodeRef}
      data-export-label={section.name}
      className={cn(
        "rounded-2xl border bg-card transition",
        isDragging ? "z-50 shadow-lg ring-2 ring-primary/40" : "border-border/60",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 rounded-t-2xl border-b border-border/60 px-5 py-3"
        style={{ backgroundColor: color.bg, color: color.fg }}
      >
        {editable && sortable && (
          <button
            data-pdf-hide
            type="button"
            className="-ml-1 flex h-8 w-8 cursor-grab items-center justify-center rounded-md hover:bg-black/5 active:cursor-grabbing"
            title={t.dragToReorder}
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical className="h-4 w-4" />
          </button>
        )}

        {Icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: color.hex, color: "#fff" }}
          >
            <Icon className="h-4 w-4" weight="fill" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold tracking-tight">
            {section.name}
          </h2>
          <p className="text-[11px] opacity-70">
            {section.items.length} {t.products}
          </p>
        </div>

        {editable && (
          <div data-pdf-hide className="flex shrink-0 items-center gap-1">
            {onAddProducts && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-black/5"
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
                className="h-8 w-8 hover:bg-black/5"
                onClick={onEditSection}
                style={{ color: color.fg }}
                title={t.editSection}
              >
                <PencilSimple className="h-3.5 w-3.5" />
              </Button>
            )}
            {onHideSection && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-black/5"
                onClick={onHideSection}
                style={{ color: color.fg }}
                title={t.hideSection}
              >
                <EyeSlash className="h-3.5 w-3.5" />
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
