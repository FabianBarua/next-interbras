"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminAttribute } from "@/services/admin/attributes"
import {
  createAttributeAction,
  deleteAttributeAction,
  bulkDeleteAttributesAction,
  updateAttributeAction,
} from "@/lib/actions/admin/attributes"
import { Modal } from "@/components/dashboard/modal"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { Toolbar, ToolbarButton } from "@/components/dashboard/toolbar"
import { DataTable } from "@/components/dashboard/data-table"

export function AttributesClient({ initialAttributes }: { initialAttributes: AdminAttribute[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const items = initialAttributes

  const handleBulk = (action: string) => {
    const ids = Array.from(selected)
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} atributo(s)?`)) return
    startTransition(async () => {
      if (action === "delete") await bulkDeleteAttributesAction(ids)
      setSelected(new Set())
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este atributo y todos sus valores?")) return
    startTransition(async () => { await deleteAttributeAction(id); router.refresh() })
  }

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => { await updateAttributeAction(id, { active }); router.refresh() })
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Atributos" }]} />
      <PageHeader
        label="Atributos"
        action={<ToolbarButton onClick={() => setShowCreate(true)} variant="primary">+ Nuevo atributo</ToolbarButton>}
      >
        Gestione atributos predefinidos (Color, Tamaño, etc.) y sus valores para usar en variantes.
      </PageHeader>

      <Toolbar
        selected={selected.size}
        bulkActions={[{ label: "Eliminar", value: "delete", destructive: true }]}
        onBulkAction={handleBulk}
      />

      <div className="mt-4">
        <DataTable
          items={items}
          getId={i => i.id}
          selected={selected}
          onSelectionChange={setSelected}
          columns={[
            {
              key: "name",
              label: "Nombre",
              render: (a) => (
                <Link href={`/dashboard/attributes/${a.id}`} className="font-medium text-primary hover:underline">
                  {a.name.es ?? a.slug}
                  {a.name.pt ? <span className="text-muted-foreground ml-1 text-xs">/ {a.name.pt}</span> : null}
                </Link>
              ),
            },
            { key: "slug", label: "Slug", render: (a) => <span className="font-mono text-xs">{a.slug}</span> },
            {
              key: "values",
              label: "Valores",
              render: (a) => (
                <Link href={`/dashboard/attributes/${a.id}`} className="text-xs text-muted-foreground hover:text-primary">
                  {a.valueCount} valor{a.valueCount !== 1 ? "es" : ""}
                </Link>
              ),
            },
            { key: "order", label: "Orden", render: (a) => <span className="tabular-nums">{a.sortOrder}</span>, className: "text-right" },
            {
              key: "active",
              label: "Activo",
              className: "text-center",
              render: (a) => (
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(a.id, !a.active) }}
                  disabled={isPending}
                  className={`w-8 h-5 rounded-full relative transition-colors ${a.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${a.active ? "left-3.5" : "left-0.5"}`} />
                </button>
              ),
            },
            {
              key: "actions",
              label: "",
              className: "text-right",
              render: (a) => (
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/dashboard/attributes/${a.id}`} className="text-xs text-primary hover:underline">Editar</Link>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id) }} className="text-xs text-destructive hover:underline">Eliminar</button>
                </div>
              ),
            },
          ]}
          emptyMessage="No hay atributos. Cree uno para empezar."
        />
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo atributo">
        <CreateAttributeForm onDone={(id) => { setShowCreate(false); router.push(`/dashboard/attributes/${id}`) }} />
      </Modal>
    </div>
  )
}

function CreateAttributeForm({ onDone }: { onDone: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState("")
  const [nameEs, setNameEs] = useState("")
  const [namePt, setNamePt] = useState("")
  const [descEs, setDescEs] = useState("")
  const [descPt, setDescPt] = useState("")
  const [sortOrder, setSortOrder] = useState(0)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createAttributeAction({
        slug: slug || nameEs.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        sortOrder,
      })
      if ("error" in res) setError(res.error ?? "Error")
      else if ("id" in res) onDone(res.id)
    })
  }

  const inputCls = "w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

  return (
    <div className="space-y-4">
      <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="ej: Color" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Slug (auto-generado si vacío)</label>
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="color" className={inputCls + " font-mono"} />
      </div>
      <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} placeholder="Descripción" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Orden</label>
        <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className={inputCls} />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending || !nameEs.trim()}
          className="h-10 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creando..." : "Crear y configurar valores"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
