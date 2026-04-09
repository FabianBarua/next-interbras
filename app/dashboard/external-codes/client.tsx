"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminExternalCode } from "@/services/admin/external-codes"
import {
  updateExternalCodeAction,
  deleteExternalCodeAction,
  bulkUpdatePricesAction,
} from "@/lib/actions/admin/external-codes"
import { Modal } from "@/components/dashboard/modal"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { Toolbar, ToolbarButton } from "@/components/dashboard/toolbar"

export function ExternalCodesClient({ initialCodes, search, system }: { initialCodes: AdminExternalCode[]; search: string; system: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchVal, setSearchVal] = useState(search)
  const [editing, setEditing] = useState<AdminExternalCode | null>(null)
  const [bulkPricing, setBulkPricing] = useState(false)
  const items = initialCodes

  const applySearch = () => {
    const params = new URLSearchParams()
    if (searchVal) params.set("search", searchVal)
    if (system) params.set("system", system)
    router.push(`/dashboard/external-codes?${params.toString()}`)
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este código externo?")) return
    startTransition(async () => { await deleteExternalCodeAction(id); router.refresh() })
  }

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }
  const toggle = (id: string) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Códigos Externos" }]} />
      <PageHeader label="Códigos Externos">
        Gestione precios y códigos de sistemas externos en un solo lugar.
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applySearch()}
          placeholder="Buscar código, SKU, producto..."
          className="h-9 w-64 rounded-lg border px-3 text-sm"
        />
        <button onClick={applySearch} className="h-9 px-3 border rounded-lg text-sm hover:bg-muted">Buscar</button>
        {search && (
          <button onClick={() => { setSearchVal(""); router.push("/dashboard/external-codes") }} className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground">
            Limpiar filtro
          </button>
        )}
        <div className="flex-1" />
        {selected.size > 0 && (
          <>
            <span className="text-sm text-muted-foreground">{selected.size} sel.</span>
            <ToolbarButton onClick={() => setBulkPricing(true)} variant="secondary">Editar precios masivo</ToolbarButton>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Sistema</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Código</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Nombre ext.</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Variante (SKU)</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Producto</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">USD</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Gs</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">BRL</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(ec => (
              <tr key={ec.id} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(ec.id)} onChange={() => toggle(ec.id)} className="rounded" /></td>
                <td className="px-3 py-2">
                  <span className="text-xs font-semibold bg-muted rounded px-1.5 py-0.5 uppercase">{ec.system}</span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{ec.code}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">{ec.externalName ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/products/${ec.productId}/variants`} className="font-mono text-xs text-primary hover:underline">
                    {ec.variantSku}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/products/${ec.productId}`} className="text-xs hover:underline">
                    {ec.productName.es ?? ec.productSlug}
                  </Link>
                  {ec.categoryName && <span className="text-[10px] text-muted-foreground ml-1">({ec.categoryName.es})</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{ec.priceUsd ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{ec.priceGs ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{ec.priceBrl ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(ec)} className="text-xs text-primary hover:underline">Editar</button>
                    <button onClick={() => handleDelete(ec.id)} disabled={isPending} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-muted-foreground">
                  {search ? "Sin resultados para la búsqueda." : "No hay códigos externos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{items.length} código(s) externo(s)</p>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar código externo">
        {editing && <EditExternalCodeForm ec={editing} onDone={() => { setEditing(null); router.refresh() }} />}
      </Modal>

      {/* Bulk pricing modal */}
      <Modal open={bulkPricing} onClose={() => setBulkPricing(false)} title="Editar precios masivamente" wide>
        <BulkPriceForm
          items={items.filter(i => selected.has(i.id))}
          onDone={() => { setBulkPricing(false); setSelected(new Set()); router.refresh() }}
        />
      </Modal>
    </div>
  )
}

function EditExternalCodeForm({ ec, onDone }: { ec: AdminExternalCode; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [system, setSystem] = useState(ec.system)
  const [code, setCode] = useState(ec.code)
  const [externalName, setExternalName] = useState(ec.externalName ?? "")
  const [priceUsd, setPriceUsd] = useState(ec.priceUsd ?? "")
  const [priceGs, setPriceGs] = useState(ec.priceGs ?? "")
  const [priceBrl, setPriceBrl] = useState(ec.priceBrl ?? "")

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateExternalCodeAction(ec.id, {
        system, code,
        externalName: externalName || null,
        priceUsd: priceUsd || null,
        priceGs: priceGs || null,
        priceBrl: priceBrl || null,
      })
      if ("error" in res) setError(res.error ?? "Error")
      else onDone()
    })
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        Variante: <span className="font-mono">{ec.variantSku}</span> · Producto: {ec.productName.es ?? ec.productSlug}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Sistema</label>
          <input value={system} onChange={e => setSystem(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Código</label>
          <input value={code} onChange={e => setCode(e.target.value)} className={inputCls + " font-mono"} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Nombre externo</label>
        <input value={externalName} onChange={e => setExternalName(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Precio USD</label>
          <input value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="0.00" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Precio Gs</label>
          <input value={priceGs} onChange={e => setPriceGs(e.target.value)} placeholder="0" className={inputCls + " font-mono"} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Precio BRL</label>
          <input value={priceBrl} onChange={e => setPriceBrl(e.target.value)} placeholder="0.00" className={inputCls + " font-mono"} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function BulkPriceForm({ items, onDone }: { items: AdminExternalCode[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState(items.map(i => ({
    id: i.id,
    sku: i.variantSku,
    code: i.code,
    priceUsd: i.priceUsd ?? "",
    priceGs: i.priceGs ?? "",
    priceBrl: i.priceBrl ?? "",
  })))

  const update = (i: number, field: string, val: string) => {
    const arr = [...rows]; arr[i] = { ...arr[i], [field]: val }; setRows(arr)
  }

  const handleSubmit = () => {
    setError(null)
    const data = rows.map(r => ({
      id: r.id,
      priceUsd: r.priceUsd || undefined,
      priceGs: r.priceGs || undefined,
      priceBrl: r.priceBrl || undefined,
    }))
    startTransition(async () => {
      const res = await bulkUpdatePricesAction(data)
      if ("error" in res) setError(res.error ?? "Error")
      else onDone()
    })
  }

  const smallCls = "h-8 rounded border px-2 text-xs w-full font-mono"

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Edite precios para {items.length} código(s) seleccionado(s).</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-2 py-2 text-left font-semibold">SKU</th>
              <th className="px-2 py-2 text-left font-semibold">Código</th>
              <th className="px-2 py-2 text-left font-semibold">USD</th>
              <th className="px-2 py-2 text-left font-semibold">Gs</th>
              <th className="px-2 py-2 text-left font-semibold">BRL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-2 py-1.5 font-mono">{r.sku}</td>
                <td className="px-2 py-1.5 font-mono">{r.code}</td>
                <td className="px-2 py-1.5"><input value={r.priceUsd} onChange={e => update(i, "priceUsd", e.target.value)} placeholder="0.00" className={smallCls} /></td>
                <td className="px-2 py-1.5"><input value={r.priceGs} onChange={e => update(i, "priceGs", e.target.value)} placeholder="0" className={smallCls} /></td>
                <td className="px-2 py-1.5"><input value={r.priceBrl} onChange={e => update(i, "priceBrl", e.target.value)} placeholder="0.00" className={smallCls} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : `Actualizar ${rows.length} precio(s)`}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
