"use client"

import type {
  CurrencyCode,
  RenderedItem,
  RenderedSection,
} from "@/lib/pdf/types"
import { SectionBlock } from "./section-block"
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
}

/**
 * Render all sections in the order given by the selectors.
 * Reordering + hiding is handled centrally in the "Manage sections" dialog,
 * so this component is intentionally dumb — no DnD, no hide buttons.
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
}: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog

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
    <div className="space-y-5">
      {sections.map((sec) => (
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
            onEditSection={
              sec.kind === "custom" ? () => onEditSection(sec.id) : undefined
            }
            onAddProducts={
              sec.kind === "custom" ? () => onAddProductsToSection(sec.id) : undefined
            }
          />
        </div>
      ))}
    </div>
  )
}
