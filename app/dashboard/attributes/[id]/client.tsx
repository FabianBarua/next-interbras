"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { AdminAttributeFull, AdminAttributeValue } from "@/services/admin/attributes"
import {
  updateAttributeAction,
  createAttributeValueAction,
  updateAttributeValueAction,
  deleteAttributeValueAction,
  bulkCreateAttributeValuesAction,
} from "@/lib/actions/admin/attributes"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { Modal } from "@/components/dashboard/modal"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"

export function AttributeEditClient({ attribute }: { attribute: AdminAttributeFull }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Attribute fields
  const [nameEs, setNameEs] = useState(attribute.name.es ?? "")
  const [namePt, setNamePt] = useState(attribute.name.pt ?? "")
  const [descEs, setDescEs] = useState(attribute.description?.es ?? "")
  const [descPt, setDescPt] = useState(attribute.description?.pt ?? "")
  const [sortOrder, setSortOrder] = useState(attribute.sortOrder)
  const [active, setActive] = useState(attribute.active)

  // Values
  const [showAddValue, setShowAddValue] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingValue, setEditingValue] = useState<AdminAttributeValue | null>(null)

  const handleSave = () => {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const res = await updateAttributeAction(attribute.id, {
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        sortOrder,
        active,
      })
      if ("error" in res) setError(res.error ?? "Error")
      else { setSuccess(true); router.refresh() }
    })
  }

  const handleDeleteValue = (id: string) => {
    if (!confirm("¿Eliminar este valor?")) return
    startTransition(async () => { await deleteAttributeValueAction(id); router.refresh() })
  }

  const handleToggleValue = (id: string, active: boolean) => {
    startTransition(async () => { await updateAttributeValueAction(id, { active }); router.refresh() })
  }

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

  return (
    <div>
      <Breadcrumbs items={[
        { label: "Atributos", href: "/dashboard/attributes" },
        { label: attribute.name.es ?? attribute.slug },
      ]} />

      <PageHeader label={attribute.name.es ?? attribute.slug}>
        Slug: <span className="font-mono">{attribute.slug}</span>
      </PageHeader>

      {/* Attribute info */}
      <section className="rounded-2xl border bg-card p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-base">Información del atributo</h2>
        <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />
        <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} placeholder="Descripción" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Activo</label>
            <label className="flex items-center gap-2 h-9">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
              <span className="text-sm">{active ? "Sí" : "No"}</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleSave} disabled={isPending}
            className="h-9 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm">
            {isPending ? "Guardando..." : "Guardar atributo"}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Guardado.</p>}
        </div>
      </section>

      {/* Values section */}
      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Valores predefinidos ({attribute.values.length})</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowBulkAdd(true)} className="h-8 px-3 border text-xs font-medium rounded-lg hover:bg-muted">
              + Agregar múltiples
            </button>
            <button onClick={() => setShowAddValue(true)} className="h-8 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90">
              + Nuevo valor
            </button>
          </div>
        </div>

        {attribute.values.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Nombre ES</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Nombre PT</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">Slug</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Orden</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground">Activo</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {attribute.values.map(v => (
                  <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{v.name.es ?? "—"}</td>
                    <td className="px-3 py-2">{v.name.pt ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{v.slug}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{v.sortOrder}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggleValue(v.id, !v.active)}
                        disabled={isPending}
                        className={`w-8 h-5 rounded-full relative transition-colors ${v.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${v.active ? "left-3.5" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingValue(v)} className="text-xs text-primary hover:underline">Editar</button>
                        <button onClick={() => handleDeleteValue(v.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Sin valores predefinidos.</p>
            <p className="text-xs mt-1">Agregue valores como &quot;Blanco&quot;, &quot;Negro&quot;, &quot;Rojo&quot; para este atributo.</p>
          </div>
        )}
      </section>

      {/* Add value modal */}
      <Modal open={showAddValue} onClose={() => setShowAddValue(false)} title="Nuevo valor">
        <ValueForm attributeId={attribute.id} onDone={() => { setShowAddValue(false); router.refresh() }} />
      </Modal>

      {/* Edit value modal */}
      <Modal open={!!editingValue} onClose={() => setEditingValue(null)} title="Editar valor">
        {editingValue && <ValueForm attributeId={attribute.id} value={editingValue} onDone={() => { setEditingValue(null); router.refresh() }} />}
      </Modal>

      {/* Bulk add modal */}
      <Modal open={showBulkAdd} onClose={() => setShowBulkAdd(false)} title="Agregar múltiples valores" wide>
        <BulkAddValues attributeId={attribute.id} onDone={() => { setShowBulkAdd(false); router.refresh() }} />
      </Modal>
    </div>
  )
}

// Single value form
function ValueForm({ attributeId, value, onDone }: { attributeId: string; value?: AdminAttributeValue; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(value?.slug ?? "")
  const [nameEs, setNameEs] = useState(value?.name.es ?? "")
  const [namePt, setNamePt] = useState(value?.name.pt ?? "")
  const [sortOrder, setSortOrder] = useState(value?.sortOrder ?? 0)
  const [active, setActive] = useState(value?.active ?? true)

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

  const handleSubmit = () => {
    setError(null)
    const autoSlug = slug || nameEs.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    startTransition(async () => {
      let res: any
      if (value) {
        res = await updateAttributeValueAction(value.id, { slug: autoSlug, name: { es: nameEs, pt: namePt }, sortOrder, active })
      } else {
        res = await createAttributeValueAction({ attributeId, slug: autoSlug, name: { es: nameEs, pt: namePt }, sortOrder, active })
      }
      if ("error" in res) setError(res.error ?? "Error")
      else onDone()
    })
  }

  return (
    <div className="space-y-4">
      <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="ej: Blanco / Branco" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Slug (auto)</label>
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto" className={inputCls + " font-mono"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending || !nameEs.trim()}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : value ? "Guardar" : "Crear valor"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}

// Bulk add values
function BulkAddValues({ attributeId, onDone }: { attributeId: string; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<{ nameEs: string; namePt: string; slug: string }[]>(
    [{ nameEs: "", namePt: "", slug: "" }, { nameEs: "", namePt: "", slug: "" }, { nameEs: "", namePt: "", slug: "" }]
  )

  const addRow = () => setRows([...rows, { nameEs: "", namePt: "", slug: "" }])
  const update = (i: number, field: string, val: string) => {
    const arr = [...rows]; arr[i] = { ...arr[i], [field]: val }; setRows(arr)
  }
  const removeRow = (i: number) => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)) }

  const handleSubmit = () => {
    setError(null)
    const valid = rows.filter(r => r.nameEs.trim())
    if (valid.length === 0) { setError("Ingrese al menos un nombre."); return }
    const data = valid.map((r, i) => ({
      attributeId,
      slug: r.slug || r.nameEs.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: { es: r.nameEs.trim(), pt: r.namePt.trim() },
      sortOrder: i,
    }))
    startTransition(async () => {
      const res = await bulkCreateAttributeValuesAction(data)
      if ("error" in res) setError(res.error ?? "Error")
      else onDone()
    })
  }

  const smallCls = "h-8 rounded border px-2 text-sm w-full"

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Agregue múltiples valores de una vez. El slug se auto-genera si está vacío.</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={r.nameEs} onChange={e => update(i, "nameEs", e.target.value)} placeholder="Nombre ES *" className={smallCls} />
            <input value={r.namePt} onChange={e => update(i, "namePt", e.target.value)} placeholder="Nombre PT" className={smallCls} />
            <input value={r.slug} onChange={e => update(i, "slug", e.target.value)} placeholder="slug (auto)" className={smallCls + " font-mono"} />
            <button type="button" onClick={() => removeRow(i)} className="text-destructive text-xs hover:underline shrink-0" disabled={rows.length <= 1}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="text-xs text-primary hover:underline">+ Agregar fila</button>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creando..." : `Crear ${rows.filter(r => r.nameEs.trim()).length} valor(es)`}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
