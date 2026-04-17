"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import type { CatalogEntry } from "@/lib/pdf/types"
import { pickI18n } from "@/lib/pdf/helpers"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onClose: () => void
  sectionId: string
  entries: CatalogEntry[]
}

export function PickProductsDialog({ open, onClose, sectionId, entries }: Props) {
  const { dict, locale } = useDictionary()
  const t = dict.catalog
  const section = useCatalogStore((s) => s.customSections.find((x) => x.id === sectionId))
  const toggleEntry = useCatalogStore((s) => s.toggleEntryInSection)

  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      const name = pickI18n(e.name, locale).toLowerCase()
      return name.includes(q) || e.code.toLowerCase().includes(q)
    })
  }, [entries, search, locale])

  const selected = new Set(section?.entryIds ?? [])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.pickFromCatalog}</DialogTitle>
          <DialogDescription>
            {selected.size} / {entries.length} {t.products}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-9"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">—</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((e) => {
                const isSelected = selected.has(e.id)
                return (
                  <li
                    key={e.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-muted/50",
                      isSelected && "bg-brand-50/60",
                    )}
                    onClick={() => toggleEntry(sectionId, e.id)}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
                      {e.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.imageUrl} alt="" className="h-full w-full object-contain p-1" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pickI18n(e.name, locale)}</p>
                      <p className="font-mono text-[11px] uppercase text-muted-foreground">
                        {e.code}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
