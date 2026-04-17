"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/i18n/context"
import { useCatalogStore } from "@/lib/pdf/store"
import type { ManualProduct, CurrencyCode } from "@/lib/pdf/types"
import { ImageUploadField } from "./image-upload-field"

interface Props {
  sectionId: string | null
  /** When editing, pass the manual product. When creating, pass null + sectionId. */
  product: ManualProduct | null
  open: boolean
  onClose: () => void
  currency: CurrencyCode
}

const EMPTY: Omit<ManualProduct, "id" | "sectionId"> = {
  name: "",
  code: "",
  price: null,
  voltage: null,
  qtyPerBox: null,
  specs: "",
  imageDataUrl: null,
}

export function ManualProductDialog({ sectionId, product, open, onClose, currency }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <ManualProductDialogBody
          key={product?.id ?? `new-${sectionId}`}
          sectionId={sectionId}
          product={product}
          onClose={onClose}
          currency={currency}
        />
      )}
    </Dialog>
  )
}

function ManualProductDialogBody({
  sectionId,
  product,
  onClose,
  currency,
}: Omit<Props, "open">) {
  const { dict } = useDictionary()
  const t = dict.catalog
  const sections = useCatalogStore((s) => s.customSections)
  const addManual = useCatalogStore((s) => s.addManualProduct)
  const updateManual = useCatalogStore((s) => s.updateManualProduct)
  const removeManual = useCatalogStore((s) => s.removeManualProduct)

  const [form, setForm] = useState<Omit<ManualProduct, "id" | "sectionId">>(() =>
    product
      ? {
          name: product.name,
          code: product.code,
          price: product.price,
          voltage: product.voltage,
          qtyPerBox: product.qtyPerBox,
          specs: product.specs,
          imageDataUrl: product.imageDataUrl,
        }
      : EMPTY,
  )
  const [targetSectionId, setTargetSectionId] = useState<string | null>(
    product?.sectionId ?? sectionId,
  )

  function handleSave() {
    const sid = targetSectionId
    if (!sid) return
    if (product) {
      updateManual(product.id, { ...form, sectionId: sid })
    } else {
      addManual({ ...form, sectionId: sid })
    }
    onClose()
  }

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {product ? t.editManualProduct : t.newManualProduct}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {!product && (
            <div className="grid gap-2">
              <Label className="text-xs">{t.selectSection}</Label>
              <Select
                value={targetSectionId ?? ""}
                onValueChange={(v) => setTargetSectionId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-xs">{t.imageLabel}</Label>
            <ImageUploadField
              value={form.imageDataUrl}
              onChange={(v) => setForm((f) => ({ ...f, imageDataUrl: v }))}
              uploadLabel={t.uploadImage}
              removeLabel={t.coverRemove}
              aspectClassName="aspect-square"
              className="max-w-50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mp-name" className="text-xs">{t.name}</Label>
            <Input
              id="mp-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="mp-code" className="text-xs">{t.code}</Label>
              <Input
                id="mp-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mp-volt" className="text-xs">{t.voltage}</Label>
              <Input
                id="mp-volt"
                value={form.voltage ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, voltage: e.target.value || null }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="mp-price" className="text-xs">{t.price} ({currency})</Label>
              <Input
                id="mp-price"
                type="number"
                step="any"
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value === "" ? null : Number(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mp-qty" className="text-xs">{t.qtyPerBox}</Label>
              <Input
                id="mp-qty"
                type="number"
                step="1"
                value={form.qtyPerBox ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qtyPerBox: e.target.value === "" ? null : Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mp-specs" className="text-xs">{t.specs}</Label>
            <Textarea
              id="mp-specs"
              rows={5}
              value={form.specs}
              placeholder={t.specsHint}
              onChange={(e) => setForm((f) => ({ ...f, specs: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {product && (
            <Button
              variant="destructive"
              onClick={() => {
                removeManual(product.id)
                onClose()
              }}
            >
              {t.delete}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={handleSave} disabled={!targetSectionId || !form.name.trim()}>
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}
