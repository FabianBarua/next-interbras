"use client"

import { memo } from "react"
import type { RenderedItem, CurrencyCode } from "@/lib/pdf/types"
import { ProductCard } from "./product-card"

interface Props {
  items: RenderedItem[]
  currency: CurrencyCode
  showPrices: boolean
  editable: boolean
  hiddenIds: Set<string>
  overrideIds: Set<string>
  onToggleHidden?: (entryId: string) => void
  onEdit?: (item: RenderedItem) => void
  onResetOverride?: (entryId: string) => void
  /** Grid columns — varies by desktop/mobile. */
  columns: number
}

function _ProductGrid({
  items,
  currency,
  showPrices,
  editable,
  hiddenIds,
  overrideIds,
  onToggleHidden,
  onEdit,
  onResetOverride,
  columns,
}: Props) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const entryId = item.entryId ?? ""
        const isHidden = entryId ? hiddenIds.has(entryId) : false
        const hasOverride = entryId ? overrideIds.has(entryId) : false
        return (
          <ProductCard
            key={item.id}
            item={item}
            currency={currency}
            showPrices={showPrices}
            isHidden={isHidden}
            editable={editable}
            onToggleHidden={
              onToggleHidden && entryId ? () => onToggleHidden(entryId) : undefined
            }
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onResetOverride={
              onResetOverride && entryId && hasOverride
                ? () => onResetOverride(entryId)
                : undefined
            }
            hasOverride={hasOverride}
          />
        )
      })}
    </div>
  )
}

export const ProductGrid = memo(_ProductGrid)
