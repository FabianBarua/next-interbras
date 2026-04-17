"use client"

import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import { Button } from "@/components/ui/button"
import { Eye } from "@phosphor-icons/react"
import type { CatalogCategory } from "@/lib/pdf/types"
import type { Locale } from "@/i18n/config"
import { pickI18n } from "@/lib/pdf/helpers"

interface Props {
  categories: CatalogCategory[]
  hiddenIds: string[]
  language: Locale
}

export function HiddenCategoriesPanel({ categories, hiddenIds, language }: Props) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const toggle = useCatalogStore((s) => s.toggleCategoryHidden)

  if (hiddenIds.length === 0) return null

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.sectionHidden}
      </div>
      <div className="flex flex-wrap gap-2">
        {hiddenIds.map((id) => {
          const cat = categories.find((c) => c.id === id)
          if (!cat) return null
          return (
            <Button
              key={id}
              variant="outline"
              size="sm"
              onClick={() => toggle(id)}
              className="h-7 gap-1.5 text-xs"
            >
              <Eye className="h-3 w-3" />
              {pickI18n(cat.name, language)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
