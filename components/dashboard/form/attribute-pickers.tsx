"use client"

import * as React from "react"
import type { I18nText } from "@/types/common"
import { TextField, SelectField, Field, Grid, smallInputCls } from "./primitives"

export type AttrDef = {
  id: string
  slug: string
  name: I18nText
  values: { id: string; slug: string; name: I18nText }[]
}

/**
 * Single dropdown per attribute. Selecting "—" leaves the attribute unset
 * for this variant. At most ONE value per attribute (DB constraint).
 */
export function AttributeValuePicker({
  attributeDefs,
  value,
  onChange,
  small = true,
  cols = 2,
}: {
  attributeDefs: AttrDef[]
  value: string[]
  onChange: (ids: string[]) => void
  small?: boolean
  cols?: 1 | 2 | 3 | 4
}) {
  if (attributeDefs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay atributos definidos. Crea atributos en{" "}
        <code className="font-mono">/dashboard/attributes</code>.
      </p>
    )
  }

  // attrId -> selected valueId
  const valueToAttr = new Map<string, string>()
  for (const a of attributeDefs) for (const v of a.values) valueToAttr.set(v.id, a.id)

  const selectedByAttr = new Map<string, string>()
  for (const vid of value) {
    const aid = valueToAttr.get(vid)
    if (aid) selectedByAttr.set(aid, vid)
  }

  const setAttr = (attrId: string, valueId: string) => {
    const next = new Map(selectedByAttr)
    if (valueId) next.set(attrId, valueId)
    else next.delete(attrId)
    onChange(Array.from(next.values()))
  }

  return (
    <Grid cols={cols}>
      {attributeDefs.map((attr) => {
        const sel = selectedByAttr.get(attr.id) ?? ""
        return (
          <div key={attr.id} className="flex items-center gap-2">
            <label className="w-20 shrink-0 truncate text-[11px] text-muted-foreground">
              {attr.name.es ?? attr.slug}
            </label>
            <select
              value={sel}
              onChange={(e) => setAttr(attr.id, e.target.value)}
              className={`flex-1 ${small ? smallInputCls : ""}`}
            >
              <option value="">—</option>
              {attr.values.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name.es ?? v.slug}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </Grid>
  )
}

/* ─────────── External code fields (sub-form) ─────────── */

export type ExternalCodeFieldsValue = {
  system: string
  code: string
  externalName: string
  priceUsd: string
  priceGs: string
  priceBrl: string
  price1: string
  price2: string
  price3: string
  stock: string
}

export const emptyExternalCode: ExternalCodeFieldsValue = {
  system: "cec",
  code: "",
  externalName: "",
  priceUsd: "",
  priceGs: "",
  priceBrl: "",
  price1: "",
  price2: "",
  price3: "",
  stock: "",
}

export function ExternalCodeFields({
  value,
  onChange,
  showStock = true,
  showExtraPrices = true,
  codeRequired = true,
  systemDisabled = false,
}: {
  value: ExternalCodeFieldsValue
  onChange: (next: ExternalCodeFieldsValue) => void
  showStock?: boolean
  showExtraPrices?: boolean
  codeRequired?: boolean
  systemDisabled?: boolean
}) {
  const set = <K extends keyof ExternalCodeFieldsValue>(k: K, v: ExternalCodeFieldsValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-3">
      <Grid cols={3}>
        <Field label="Sistema" required>
          <select
            value={value.system}
            onChange={(e) => set("system", e.target.value)}
            disabled={systemDisabled}
            className={`h-9 w-full rounded-lg border border-input bg-background px-3 text-sm ${systemDisabled ? "opacity-50" : ""}`}
          >
            <option value="cec">CEC</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
        <TextField
          label="Código"
          value={value.code}
          onChange={(v) => set("code", v)}
          required={codeRequired}
          mono
          placeholder="ej: 12345"
        />
        <TextField
          label="Nombre externo"
          value={value.externalName}
          onChange={(v) => set("externalName", v)}
          placeholder="(opcional)"
        />
      </Grid>

      <Grid cols={3}>
        <TextField label="USD" value={value.priceUsd} onChange={(v) => set("priceUsd", v)} placeholder="0.00" mono />
        <TextField label="Gs" value={value.priceGs} onChange={(v) => set("priceGs", v)} placeholder="0" mono />
        <TextField label="BRL" value={value.priceBrl} onChange={(v) => set("priceBrl", v)} placeholder="0.00" mono />
      </Grid>

      {showExtraPrices && (
        <Grid cols={3}>
          <TextField label="Precio 1" value={value.price1} onChange={(v) => set("price1", v)} placeholder="0.00" mono />
          <TextField label="Precio 2" value={value.price2} onChange={(v) => set("price2", v)} placeholder="0.00" mono />
          <TextField label="Precio 3" value={value.price3} onChange={(v) => set("price3", v)} placeholder="0.00" mono />
        </Grid>
      )}

      {showStock && (
        <TextField
          label="Stock"
          value={value.stock}
          onChange={(v) => set("stock", v)}
          type="number"
          min={0}
          placeholder="—"
          mono
          inputClassName="w-32"
        />
      )}
    </div>
  )
}

/** Convert form fields to API payload (empty strings → undefined / null). */
export function externalCodeFieldsToPayload(v: ExternalCodeFieldsValue) {
  return {
    system: v.system.trim() || "cec",
    code: v.code.trim(),
    externalName: v.externalName.trim() || undefined,
    priceUsd: v.priceUsd || undefined,
    priceGs: v.priceGs || undefined,
    priceBrl: v.priceBrl || undefined,
    price1: v.price1 || undefined,
    price2: v.price2 || undefined,
    price3: v.price3 || undefined,
    stock: v.stock !== "" ? parseInt(v.stock, 10) : null,
  }
}

// Suppress eslint unused for SelectField (re-exported convenience)
void SelectField
