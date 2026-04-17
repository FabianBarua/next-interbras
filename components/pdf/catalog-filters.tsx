"use client"

import { useDictionary } from "@/i18n/context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import type { CatalogCategory } from "@/lib/pdf/types"
import { pickI18n } from "@/lib/pdf/helpers"

export interface CatalogFiltersState {
  search: string
  categoryId: string | null
  voltage: "all" | "110V" | "220V" | "Bivolt"
}

interface Props {
  value: CatalogFiltersState
  onChange: (next: CatalogFiltersState) => void
  categories: CatalogCategory[]
}

export function CatalogFilters({ value, onChange, categories }: Props) {
  const { dict, locale } = useDictionary()
  const t = dict.catalog

  const hasFilters =
    value.search.trim() !== "" ||
    value.categoryId !== null ||
    value.voltage !== "all"

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
      <div className="relative min-w-55 flex-1">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder={t.searchPlaceholder}
          className="h-9 pl-9"
        />
      </div>

      <Select
        value={value.categoryId ?? "__all"}
        onValueChange={(v) =>
          onChange({ ...value, categoryId: v === "__all" ? null : v })
        }
      >
        <SelectTrigger size="sm" className="min-w-45">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">{t.allCategories}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {pickI18n(c.name, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.voltage}
        onValueChange={(v) =>
          onChange({ ...value, voltage: v as CatalogFiltersState["voltage"] })
        }
      >
        <SelectTrigger size="sm" className="min-w-38">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.allVoltages}</SelectItem>
          <SelectItem value="110V">110V</SelectItem>
          <SelectItem value="220V">220V</SelectItem>
          <SelectItem value="Bivolt">Bivolt</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ search: "", categoryId: null, voltage: "all" })
          }
        >
          <X className="h-4 w-4" />
          {t.clearFilters}
        </Button>
      )}
    </div>
  )
}
