"use client"

import { useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import type {
  CurrencyCode,
  RenderedItem,
  RenderedSection,
} from "@/lib/pdf/types"
import { SectionBlock } from "./section-block"
import { useCatalogStore } from "@/lib/pdf/store"
import { useDictionary } from "@/i18n/context"
import { Empty } from "@/components/ui/empty"

interface Props {
  sections: RenderedSection[]
  currency: CurrencyCode
  showPrices: boolean
  editable: boolean
  columns: number
  hiddenEntryIds: Set<string>
  overrideIds: Set<string>
  onToggleEntryHidden: (entryId: string) => void
  onEditItem: (item: RenderedItem) => void
  onResetOverride: (entryId: string) => void
  onEditSection: (sectionId: string) => void
  onAddProductsToSection: (sectionId: string) => void
  onRegisterRef?: (id: string, el: HTMLElement | null) => void
  /** Full entries (used only to re-key categories sort). */
  categoryOrder: string[]
}

/**
 * Renders all catalog sections with drag & drop reordering.
 * Custom sections and category sections each have their own sortable context,
 * but they share the same visual list.
 */
export function SectionList({
  sections,
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
  onAddProductsToSection,
  onRegisterRef,
  categoryOrder,
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const reorderCustom = useCatalogStore((s) => s.reorderCustomSections)
  const reorderCategories = useCatalogStore((s) => s.reorderCategories)
  const toggleCategoryHidden = useCatalogStore((s) => s.toggleCategoryHidden)

  const customIds = useMemo(
    () => sections.filter((s) => s.kind === "custom").map((s) => s.id),
    [sections],
  )
  const categoryIds = useMemo(
    () => sections.filter((s) => s.kind === "category").map((s) => s.id),
    [sections],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(ctx: "custom" | "category") {
    return (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      if (ctx === "custom") {
        const oldIdx = customIds.indexOf(String(active.id))
        const newIdx = customIds.indexOf(String(over.id))
        if (oldIdx === -1 || newIdx === -1) return
        reorderCustom(arrayMove(customIds, oldIdx, newIdx))
      } else {
        const oldIdx = categoryOrder.indexOf(String(active.id))
        const newIdx = categoryOrder.indexOf(String(over.id))
        if (oldIdx === -1 || newIdx === -1) return
        reorderCategories(arrayMove(categoryOrder, oldIdx, newIdx))
      }
    }
  }

  if (sections.length === 0) {
    return (
      <Empty className="rounded-2xl border border-dashed border-border/60 bg-card py-16">
        <div className="text-center">
          <p className="text-sm font-semibold">{t.noSections}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.noSectionsHint}</p>
        </div>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      {customIds.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd("custom")}
        >
          <SortableContext items={customIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections
                .filter((s) => s.kind === "custom")
                .map((sec) => (
                  <div key={sec.id} ref={(el) => onRegisterRef?.(sec.id, el)}>
                    <SectionBlock
                      section={sec}
                      currency={currency}
                      showPrices={showPrices}
                      editable={editable}
                      columns={columns}
                      hiddenEntryIds={hiddenEntryIds}
                      overrideIds={overrideIds}
                      onToggleEntryHidden={onToggleEntryHidden}
                      onEditItem={onEditItem}
                      onResetOverride={onResetOverride}
                      onEditSection={() => onEditSection(sec.id)}
                      onAddProducts={() => onAddProductsToSection(sec.id)}
                      sortableId={sec.id}
                      sortable
                    />
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {categoryIds.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd("category")}
        >
          <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections
                .filter((s) => s.kind === "category")
                .map((sec) => (
                  <div key={sec.id} ref={(el) => onRegisterRef?.(sec.id, el)}>
                    <SectionBlock
                      section={sec}
                      currency={currency}
                      showPrices={showPrices}
                      editable={editable}
                      columns={columns}
                      hiddenEntryIds={hiddenEntryIds}
                      overrideIds={overrideIds}
                      onToggleEntryHidden={onToggleEntryHidden}
                      onEditItem={onEditItem}
                      onResetOverride={onResetOverride}
                      onHideSection={() => toggleCategoryHidden(sec.id)}
                      sortableId={sec.id}
                      sortable
                    />
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
