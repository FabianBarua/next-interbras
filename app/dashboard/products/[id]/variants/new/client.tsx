"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { I18nText } from "@/types/common"
import { createVariantAction, bulkCreateVariantsAction } from "@/lib/actions/admin/variants"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"

type AttrDef = { id: string; slug: string; name: I18nText; values: { id: string; slug: string; name: I18nText }[] }

export function VariantCreateClient({
  productId,
  productName,
  attributeDefs,
}: {
  productId: string
  productName: string
  attributeDefs: AttrDef[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "bulk" ? "bulk" : "single"
  const [mode, setMode] = useState<"single" | "bulk">(initialMode)

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Productos", href: "/dashboard/products" },
        { label: productName, href: `/dashboard/products/${productId}` },
        { label: "Variantes", href: `/dashboard/products/${productId}/variants` },
        { label: mode === "bulk" ? "Agregar múltiples" : "Nueva" },
      ]} />
      <PageHeader label={mode === "bulk" ? "Agregar múltiples variantes" : "Nueva variante"}>
        Producto: {productName}
      </PageHeader>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "single" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Individual
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === "bulk" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Múltiples
        </button>
      </div>

      {mode === "single" ? (
        <SingleVariantForm productId={productId} attributeDefs={attributeDefs} />
      ) : (
        <BulkVariantForm productId={productId} attributeDefs={attributeDefs} />
      )}
    </div>
  )
}

/* ─── Single variant form ─── */

function SingleVariantForm({ productId, attributeDefs }: { productId: string; attributeDefs: AttrDef[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [sku, setSku] = useState("")
  const [options, setOptions] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }])
  const [unitsPerBox, setUnitsPerBox] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [active, setActive] = useState(true)
  const [images, setImages] = useState<string[]>([])

  const [ecSystem, setEcSystem] = useState("cec")
  const [ecCode, setEcCode] = useState("")
  const [ecName, setEcName] = useState("")
  const [priceUsd, setPriceUsd] = useState("")
  const [priceGs, setPriceGs] = useState("")
  const [priceBrl, setPriceBrl] = useState("")
  const [price1, setPrice1] = useState("")
  const [price2, setPrice2] = useState("")
  const [price3, setPrice3] = useState("")

  const addOption = () => setOptions([...options, { key: "", value: "" }])
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i: number, field: "key" | "value", val: string) => {
    const arr = [...options]; arr[i] = { ...arr[i], [field]: val }; setOptions(arr)
  }

  const getValuesForKey = (key: string) => {
    const attr = attributeDefs.find(a => a.slug === key)
    return attr?.values ?? []
  }

  const handleSubmit = () => {
    setError(null)
    const optionsObj: Record<string, string> = {}
    for (const o of options) {
      if (o.key.trim()) optionsObj[o.key.trim()] = o.value.trim()
    }

    const hasEc = ecCode.trim()
    const ecData = hasEc ? {
      system: ecSystem.trim() || "cec",
      code: ecCode.trim(),
      externalName: ecName || undefined,
      priceUsd: priceUsd || undefined,
      priceGs: priceGs || undefined,
      priceBrl: priceBrl || undefined,
      price1: price1 || undefined,
      price2: price2 || undefined,
      price3: price3 || undefined,
    } : undefined

    startTransition(async () => {
      const res = await createVariantAction({
        productId,
        sku,
        options: optionsObj,
        unitsPerBox: unitsPerBox ? parseInt(unitsPerBox) : null,
        sortOrder,
        active,
        images,
        externalCode: ecData,
      })
      if (res.error) setError(res.error)
      else router.push(`/dashboard/products/${productId}/variants`)
    })
  }

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>}

      {/* SKU + Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">SKU *</label>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU-001" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      {/* Options with attribute picker */}
      <AttributePicker options={options} attributeDefs={attributeDefs} onAdd={addOption} onRemove={removeOption} onUpdate={updateOption} getValuesForKey={getValuesForKey} />

      {/* Units & Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Uds/Caja</label>
          <input type="number" value={unitsPerBox} onChange={e => setUnitsPerBox(e.target.value)} placeholder="—" className={inputCls} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>

      {/* External Code & Prices */}
      <ExternalCodeFields
        ecSystem={ecSystem} setEcSystem={setEcSystem}
        ecCode={ecCode} setEcCode={setEcCode}
        ecName={ecName} setEcName={setEcName}
        priceUsd={priceUsd} setPriceUsd={setPriceUsd}
        priceGs={priceGs} setPriceGs={setPriceGs}
        priceBrl={priceBrl} setPriceBrl={setPriceBrl}
        price1={price1} setPrice1={setPrice1}
        price2={price2} setPrice2={setPrice2}
        price3={price3} setPrice3={setPrice3}
      />

      {/* Images */}
      <ImageUpload value={images} onChange={setImages} max={10} label="Imágenes de la variante" />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <button onClick={handleSubmit} disabled={isPending || !sku.trim()}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creando..." : "Crear variante"}
        </button>
        <button onClick={() => router.back()} disabled={isPending} className="h-10 px-4 border rounded-lg text-sm hover:bg-muted">
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ─── Bulk variant form ─── */

interface BulkRow {
  sku: string
  optionKey: string
  optionValue: string
  unitsPerBox: string
  ecSystem: string
  ecCode: string
  priceUsd: string
  priceGs: string
  priceBrl: string
  price1: string
  price2: string
  price3: string
}

function emptyRow(): BulkRow {
  return { sku: "", optionKey: "", optionValue: "", unitsPerBox: "", ecSystem: "cec", ecCode: "", priceUsd: "", priceGs: "", priceBrl: "", price1: "", price2: "", price3

function emptyRow(): BulkRow {
  return { sku: "", optionKey: "", optionValue: "", unitsPerBox: "", ecSystem: "cec", ecCode: "", priceUsd: "", priceGs: "", priceBrl: "", price1: "", price2: "", price3: "" }
}

function BulkVariantForm({ productId, attributeDefs }: { productId: string; attributeDefs: AttrDef[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()])
  const [selectedAttr, setSelectedAttr] = useState("")

  const addRow = () => setRows([...rows, emptyRow()])
  const addRows = (n: number) => setRows([...rows, ...Array.from({ length: n }, () => emptyRow())])
  const removeRow = (i: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, idx) => idx !== i))
  }
  const updateRow = (i: number, field: keyof BulkRow, val: string) => {
    const arr = [...rows]; arr[i] = { ...arr[i], [field]: val }; setRows(arr)
  }

  const applyAttrToRows = (attrSlug: string) => {
    setSelectedAttr(attrSlug)
    setRows(rows.map(r => ({ ...r, optionKey: attrSlug })))
  }

  const selectedAttrDef = attributeDefs.find(a => a.slug === selectedAttr)

  const handleSubmit = () => {
    setError(null)
    const validRows = rows.filter(r => r.sku.trim())
    if (validRows.length === 0) { setError("Ingrese al menos un SKU."); return }

    const data = validRows.map((r, i) => ({
      productId,
      sku: r.sku.trim(),
      options: r.optionKey.trim() ? { [r.optionKey.trim()]: r.optionValue.trim() } : {},
      unitsPerBox: r.unitsPerBox ? parseInt(r.unitsPerBox) : null,
      sortOrder: i,
      active: true,
      externalCode: r.ecCode.trim() ? {
        system: r.ecSystem.trim() || "cec",
        code: r.ecCode.trim(),
        price1: r.price1 || undefined,
        price2: r.price2 || undefined,
        price3: r.price3 || undefined,
        priceUsd: r.priceUsd || undefined,
        priceGs: r.priceGs || undefined,
        priceBrl: r.priceBrl || undefined,
        price1: r.price1 || undefined,
        price2: r.price2 || undefined,
        price3: r.price3 || undefined,
      } : undefined,
    }))

    startTransition(async () => {
      const res = await bulkCreateVariantsAction(data)
      if ("error" in res) setError(res.error ?? "Error")
      else router.push(`/dashboard/products/${productId}/variants`)
    })
  }

  const smallCls = "h-8 rounded border px-2 text-xs w-full"

  return (
    <div className="space-y-4">
      {/* Attribute selector */}
      {attributeDefs.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">Atributo predefinido</h3>
          <p className="text-xs text-muted-foreground">
            Seleccione un atributo para aplicar a todas las filas. Los valores predefinidos aparecerán como opciones.
          </p>
          <div className="flex items-center gap-3">
            <select value={selectedAttr} onChange={e => applyAttrToRows(e.target.value)} className="h-9 rounded-lg border px-3 text-sm">
              <option value="">— Sin atributo predefinido —</option>
              {attributeDefs.map(a => (
                <option key={a.id} value={a.slug}>{a.name.es ?? a.slug}</option>
              ))}
            </select>
            {selectedAttrDef && selectedAttrDef.values.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAttrDef.values.map(v => (
                  <span key={v.id} className="text-xs bg-muted rounded-full px-2 py-0.5">{v.name.es ?? v.slug}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>}

      {/* Bulk table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">SKU *</th>
              <th className="px-2 py-2 text-left font-semibold">Opción clave</th>
              <th className="px-2 py-2 text-left font-semibold">Opción valor</th>
              <th className="px-2 py-2 text-left font-semibold">P1</th>
              <th className="px-2 py-2 text-left font-semibold">P2</th>
              <th className="px-2 py-2 text-left font-semibold">P3</th>
              <th className="px-2 py-2 text-left font-semibold">Uds/Caja</th>
              <th className="px-2 py-2 text-left font-semibold">Sistema</th>
              <th className="px-2 py-2 text-left font-semibold">Cód. ext.</th>
              <th className="px-2 py-2 text-left font-semibold">USD</th>
              <th className="px-2 py-2 text-left font-semibold">Gs</th>
              <th className="px-2 py-2 text-left font-semibold">BRL</th>
              <th className="px-2 py-2 text-left font-semibold">P1</th>
              <th className="px-2 py-2 text-left font-semibold">P2</th>
              <th className="px-2 py-2 text-left font-semibold">P3</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="px-1 py-1"><input value={r.sku} onChange={e => updateRow(i, "sku", e.target.value)} placeholder="SKU" className={smallCls + " font-mono"} /></td>
                <td className="px-1 py-1"><input value={r.optionKey} onChange={e => updateRow(i, "optionKey", e.target.value)} placeholder="Atributo" className={smallCls} /></td>
                <td className="px-1 py-1">
                  {selectedAttrDef && selectedAttrDef.values.length > 0 ? (
                    <select value={r.optionValue} onChange={e => updateRow(i, "optionValue", e.target.value)} className={smallCls}>
                      <option value="">—</option>
                      {selectedAttrDef.values.map(v => (
                        <option key={v.id} value={v.name.es ?? v.slug}>{v.name.es ?? v.slug}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={r.optionValue} onChange={e => updateRow(i, "optionValue", e.target.value)} placeholder="Valor" className={smallCls} />
                  )}
                </td>
                <td className="px-1 py-1"><input value={r.unitsPerBox} onChange={e => updateRow(i, "unitsPerBox", e.target.value)} placeholder="—" className={smallCls} /></td>
                <td className="px-1 py-1">
                <td className="px-1 py-1"><input value={r.price1} onChange={e => updateRow(i, "price1", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.price2} onChange={e => updateRow(i, "price2", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.price3} onChange={e => updateRow(i, "price3", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                  <select value={r.ecSystem} onChange={e => updateRow(i, "ecSystem", e.target.value)} className={smallCls}>
                    <option value="cec">CEC</option>
                    <option value="custom">Custom</option>
                  </select>
                </td>
                <td className="px-1 py-1"><input value={r.ecCode} onChange={e => updateRow(i, "ecCode", e.target.value)} placeholder="Código" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.priceUsd} onChange={e => updateRow(i, "priceUsd", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.priceGs} onChange={e => updateRow(i, "priceGs", e.target.value)} placeholder="0" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.priceBrl} onChange={e => updateRow(i, "priceBrl", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.price1} onChange={e => updateRow(i, "price1", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.price2} onChange={e => updateRow(i, "price2", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1"><input value={r.price3} onChange={e => updateRow(i, "price3", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-1 py-1">
                  <button type="button" onClick={() => removeRow(i)} className="text-destructive hover:underline text-xs" disabled={rows.length <= 1}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add rows */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={addRow} className="text-xs text-primary hover:underline">+ Agregar fila</button>
        <button type="button" onClick={() => addRows(5)} className="text-xs text-primary hover:underline">+ Agregar 5 filas</button>
        <button type="button" onClick={() => addRows(10)} className="text-xs text-primary hover:underline">+ Agregar 10 filas</button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <button onClick={handleSubmit} disabled={isPending}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creando..." : `Crear ${rows.filter(r => r.sku.trim()).length} variante(s)`}
        </button>
        <button onClick={() => router.back()} disabled={isPending} className="h-10 px-4 border rounded-lg text-sm hover:bg-muted">
          Cancelar
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}

/* ─── Shared: Attribute Picker ─── */

function AttributePicker({
  options,
  attributeDefs,
  onAdd,
  onRemove,
  onUpdate,
  getValuesForKey,
}: {
  options: { key: string; value: string }[]
  attributeDefs: AttrDef[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: "key" | "value", val: string) => void
  getValuesForKey: (key: string) => { id: string; slug: string; name: I18nText }[]
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Opciones / Atributos</h3>
        <button type="button" onClick={onAdd} className="text-xs text-primary hover:underline">+ Agregar opción</button>
      </div>

      {attributeDefs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Seleccione un atributo predefinido del dropdown, o escriba uno personalizado.
          Los valores predefinidos aparecerán automáticamente.
        </p>
      )}

      {options.map((o, i) => {
        const suggestedValues = getValuesForKey(o.key)
        const isPredefined = attributeDefs.some(a => a.slug === o.key)
        return (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              {attributeDefs.length > 0 ? (
                <div className="flex gap-1">
                  <select
                    value={isPredefined ? o.key : "__custom__"}
                    onChange={e => {
                      if (e.target.value === "__custom__") onUpdate(i, "key", "")
                      else { onUpdate(i, "key", e.target.value); onUpdate(i, "value", "") }
                    }}
                    className="h-8 rounded border px-2 text-xs flex-1"
                  >
                    <option value="__custom__">Personalizado...</option>
                    {attributeDefs.map(a => (
                      <option key={a.id} value={a.slug}>{a.name.es ?? a.slug}</option>
                    ))}
                  </select>
                  {!isPredefined && (
                    <input value={o.key} onChange={e => onUpdate(i, "key", e.target.value)} placeholder="Clave" className="flex-1 h-8 rounded border px-2 text-sm" />
                  )}
                </div>
              ) : (
                <input value={o.key} onChange={e => onUpdate(i, "key", e.target.value)} placeholder="Clave (ej: Color)" className="w-full h-8 rounded border px-2 text-sm" />
              )}
            </div>
            <div className="flex-1">
              {suggestedValues.length > 0 ? (
                <select value={o.value} onChange={e => onUpdate(i, "value", e.target.value)} className="w-full h-8 rounded border px-2 text-xs">
                  <option value="">— Seleccionar valor —</option>
                  {suggestedValues.map(v => (
                    <option key={v.id} value={v.name.es ?? v.slug}>{v.name.es ?? v.slug}</option>
                  ))}
                </select>
              ) : (
                <input value={o.value} onChange={e => onUpdate(i, "value", e.target.value)} placeholder="Valor (ej: Blanco)" className="w-full h-8 rounded border px-2 text-sm" />
              )}
            </div>
            <button type="button" onClick={() => onRemove(i)} className="text-destructive text-xs hover:underline shrink-0 mt-1">✕</button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Shared: External Code Fields ─── */

function ExternalCodeFields({
  ecSystem, setEcSystem,
  ecCode, setEcCode,
  ecName, setEcName,
  priceUsd, setPriceUsd,
  priceGs, setPriceGs,
  priceBrl, setPriceBrl,
  price1, setPrice1,
  price2, setPrice2,
  price3, setPrice3,
}: {
  ecSystem: string; setEcSystem: (v: string) => void
  ecCode: string; setEcCode: (v: string) => void
  ecName: string; setEcName: (v: string) => void
  priceUsd: string; setPriceUsd: (v: string) => void
  priceGs: string; setPriceGs: (v: string) => void
  priceBrl: string; setPriceBrl: (v: string) => void
  price1: string; setPrice1: (v: string) => void
  price2: string; setPrice2: (v: string) => void
  price3: string; setPrice3: (v: string) => void
}) {
  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-shadow"

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">Código externo / Precios</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Sistema *</label>
          <select value={ecSystem} onChange={e => setEcSystem(e.target.value)} className={inputCls}>
            <option value="cec">CEC</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Código *</label>
          <input value={ecCode} onChange={e => setEcCode(e.target.value)} placeholder="Código externo" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Nombre externo</label>
          <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Nombre en sistema externo" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio USD</label>
          <input value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio Gs</label>
          <input value={priceGs} onChange={e => setPriceGs(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio BRL</label>
          <input value={priceBrl} onChange={e => setPriceBrl(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio 1</label>
          <input value={price1} onChange={e => setPrice1(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio 2</label>
          <input value={price2} onChange={e => setPrice2(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Precio 3</label>
          <input value={price3} onChange={e => setPrice3(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
      </div>
    </div>
  )
}
