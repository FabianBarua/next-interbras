"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import type { CatalogEntry, EntryOverride, CurrencyCode } from "@/lib/pdf/types"
import { getEntryPrice, pickI18n } from "@/lib/pdf/helpers"
import { ImageUploadField } from "./image-upload-field"

interface Props {
  /** Entry being edited. Null means the dialog is closed. */
  entry: CatalogEntry | null
  currency: CurrencyCode
  onClose: () => void
}

/**
 * Edits user overrides for a catalog entry (name, code, price, specs…).
 * Fields left blank reset to server defaults on save.
 */
export function ProductEditDialog({ entry, currency, onClose }: Props) {
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      {entry && (
        <ProductEditDialogBody
          key={entry.id}
          entry={entry}
          currency={currency}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function ProductEditDialogBody({
  entry,
  currency,
  onClose,
}: {
  entry: CatalogEntry
  currency: CurrencyCode
  onClose: () => void
}) {
  const { dict, locale } = useDictionary()
  const t = dict.catalog
  const existing = useCatalogStore((s) => s.entryOverrides[entry.id])
  const updateOverride = useCatalogStore((s) => s.updateEntryOverride)
  const resetOverride = useCatalogStore((s) => s.resetEntryOverride)

  const [form, setForm] = useState<EntryOverride>(() => existing ?? {})

  const serverPrice = getEntryPrice(entry, currency)

  const setField = <K extends keyof EntryOverride>(key: K, value: EntryOverride[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleSave() {
    // Strip empty strings so defaults come through again.
    const clean: EntryOverride = {}
    if (form.hidden) clean.hidden = true
    if (form.name && form.name.trim()) clean.name = form.name.trim()
    if (form.code && form.code.trim()) clean.code = form.code.trim()
    if (form.price !== undefined && !Number.isNaN(form.price)) clean.price = form.price
    if (form.specs && form.specs.trim()) clean.specs = form.specs
    if (form.voltage && form.voltage.trim()) clean.voltage = form.voltage.trim()
    if (form.qtyPerBox !== undefined && !Number.isNaN(form.qtyPerBox)) clean.qtyPerBox = form.qtyPerBox
    if (form.imageDataUrl) clean.imageDataUrl = form.imageDataUrl

    // Overwrite (not merge) by resetting first
    resetOverride(entry.id)
    if (Object.keys(clean).length > 0) {
      updateOverride(entry.id, clean)
    }
    onClose()
  }

  function handleReset() {
    resetOverride(entry.id)
    onClose()
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.editProduct}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{entry.code}</span> · {pickI18n(entry.name, locale)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="ov-image" className="text-xs">{t.imageLabel}</Label>
            <ImageUploadField
              value={form.imageDataUrl ?? entry.imageUrl}
              onChange={(v) => setField("imageDataUrl", v ?? undefined)}
              uploadLabel={t.uploadImage}
              removeLabel={t.coverRemove}
              aspectClassName="aspect-square"
              className="max-w-50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ov-name" className="text-xs">{t.name}</Label>
            <Input
              id="ov-name"
              value={form.name ?? ""}
              placeholder={pickI18n(entry.name, locale)}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ov-code" className="text-xs">{t.code}</Label>
              <Input
                id="ov-code"
                value={form.code ?? ""}
                placeholder={entry.code}
                onChange={(e) => setField("code", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ov-voltage" className="text-xs">{t.voltage}</Label>
              <Input
                id="ov-voltage"
                value={form.voltage ?? ""}
                placeholder={entry.voltage ?? ""}
                onChange={(e) => setField("voltage", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ov-price" className="text-xs">
                {t.price} ({currency})
              </Label>
              <Input
                id="ov-price"
                type="number"
                step="any"
                value={form.price ?? ""}
                placeholder={serverPrice !== null ? String(serverPrice) : ""}
                onChange={(e) =>
                  setField(
                    "price",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ov-qty" className="text-xs">{t.qtyPerBox}</Label>
              <Input
                id="ov-qty"
                type="number"
                step="1"
                min="0"
                value={form.qtyPerBox ?? ""}
                placeholder={entry.qtyPerBox !== null ? String(entry.qtyPerBox) : ""}
                onChange={(e) =>
                  setField(
                    "qtyPerBox",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ov-specs" className="text-xs">{t.specs}</Label>
            <Textarea
              id="ov-specs"
              rows={5}
              value={form.specs ?? ""}
              placeholder={t.specsHint}
              onChange={(e) => setField("specs", e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">{t.specsHint}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existing && (
            <Button variant="ghost" onClick={handleReset}>
              {t.resetProduct}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={handleSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
  )
}
