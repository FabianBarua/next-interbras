"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Category } from "@/types/category"
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  bulkDeleteCategoriesAction,
  bulkToggleCategoriesAction,
} from "@/lib/actions/admin/categories"
import { Modal } from "@/components/dashboard/modal"
import { I18nInput } from "@/components/dashboard/i18n-input"
import { ImageUpload } from "@/components/dashboard/image-upload"

export function CategoriesTable({ items }: { items: Category[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Category | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [bulkAction, setBulkAction] = useState("")

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)))
  }

  const handleBulk = () => {
    if (!bulkAction || selected.size === 0) return
    startTransition(async () => {
      const ids = Array.from(selected)
      if (bulkAction === "delete") {
        if (!confirm(`¿Eliminar ${ids.length} categoría(s)?`)) return
        const res = await bulkDeleteCategoriesAction(ids)
        if ("error" in res) setError(res.error!)
      } else if (bulkAction === "activate") {
        await bulkToggleCategoriesAction(ids, true)
      } else if (bulkAction === "deactivate") {
        await bulkToggleCategoriesAction(ids, false)
      }
      setSelected(new Set())
      setBulkAction("")
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return
    startTransition(async () => {
      const res = await deleteCategoryAction(id)
      if ("error" in res) setError(res.error!)
      router.refresh()
    })
  }

  const handleToggle = (item: Category) => {
    startTransition(async () => {
      await updateCategoryAction(item.id, { active: !item.active })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowCreate(true)} className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
          + Nueva categoría
        </button>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.size} seleccionada(s)</span>
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="h-9 rounded-lg border px-2 text-sm">
              <option value="">Acción masiva...</option>
              <option value="activate">Activar</option>
              <option value="deactivate">Desactivar</option>
              <option value="delete">Eliminar</option>
            </select>
            <button onClick={handleBulk} disabled={!bulkAction || isPending} className="h-9 px-3 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50">
              Aplicar
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-3 py-3"><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th>
              <th className="w-16 px-3 py-3 text-left font-medium">Img</th>
              <th className="px-3 py-3 text-left font-medium">Slug</th>
              <th className="px-3 py-3 text-left font-medium">Nombre (ES)</th>
              <th className="px-3 py-3 text-left font-medium">Nombre (PT)</th>
              <th className="px-3 py-3 text-center font-medium">Orden</th>
              <th className="px-3 py-3 text-center font-medium">Activo</th>
              <th className="px-3 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-center"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                <td className="px-3 py-2">
                  {item.image ? (
                    <div className="relative w-10 h-10 rounded border bg-muted/30 overflow-hidden">
                      <Image src={item.image} alt="" fill className="object-contain p-0.5" />
                    </div>
                  ) : <div className="w-10 h-10 rounded border bg-muted/30" />}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{item.slug}</td>
                <td className="px-3 py-2">{item.name.es ?? "—"}</td>
                <td className="px-3 py-2">{item.name.pt ?? "—"}</td>
                <td className="px-3 py-2 text-center">{item.sortOrder}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => handleToggle(item)} disabled={isPending}
                    className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${item.active ? "bg-green-500" : "bg-muted"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${item.active ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button onClick={() => setEditItem(item)} className="text-xs text-primary hover:underline">Editar</button>
                  <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-xs text-destructive hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay categorías.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Categoría">
        <CategoryForm onSave={() => { setShowCreate(false); router.refresh() }} setError={setError} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar Categoría">
        {editItem && <CategoryForm item={editItem} onSave={() => { setEditItem(null); router.refresh() }} setError={setError} />}
      </Modal>
    </div>
  )
}

function CategoryForm({ item, onSave, setError }: { item?: Category; onSave: () => void; setError: (e: string | null) => void }) {
  const [isPending, startTransition] = useTransition()
  const [slug, setSlug] = useState(item?.slug ?? "")
  const [nameEs, setNameEs] = useState(item?.name.es ?? "")
  const [namePt, setNamePt] = useState(item?.name.pt ?? "")
  const [descEs, setDescEs] = useState(item?.description?.es ?? "")
  const [descPt, setDescPt] = useState(item?.description?.pt ?? "")
  const [shortEs, setShortEs] = useState(item?.shortDescription?.es ?? "")
  const [shortPt, setShortPt] = useState(item?.shortDescription?.pt ?? "")
  const [images, setImages] = useState<string[]>(item?.image ? [item.image] : [])
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0)
  const [active, setActive] = useState(item?.active ?? true)

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const data = {
        slug,
        name: { es: nameEs, pt: namePt },
        description: descEs || descPt ? { es: descEs, pt: descPt } : undefined,
        shortDescription: shortEs || shortPt ? { es: shortEs, pt: shortPt } : undefined,
        image: images[0] || undefined,
        sortOrder,
        active,
      }
      const res = item
        ? await updateCategoryAction(item.id, data)
        : await createCategoryAction(data)
      if ("error" in res) setError(res.error!)
      else onSave()
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Slug</label>
        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="mi-categoria" disabled={!!item}
          className="w-full h-9 rounded-lg border px-3 text-sm font-mono disabled:opacity-50" />
      </div>
      <I18nInput label="Nombre" valueEs={nameEs} valuePt={namePt} onChangeEs={setNameEs} onChangePt={setNamePt} placeholder="Nombre" />
      <I18nInput label="Descripción corta" valueEs={shortEs} valuePt={shortPt} onChangeEs={setShortEs} onChangePt={setShortPt} placeholder="Descripción corta" />
      <I18nInput label="Descripción" valueEs={descEs} valuePt={descPt} onChangeEs={setDescEs} onChangePt={setDescPt} textarea placeholder="Descripción" />
      <ImageUpload value={images} onChange={setImages} max={1} label="Imagen" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Orden</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full h-9 rounded-lg border px-3 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Activo</label>
          <label className="flex items-center gap-2 h-9">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
            <span className="text-sm">{active ? "Sí" : "No"}</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={handleSubmit} disabled={isPending}
          className="h-9 px-6 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Guardando..." : item ? "Guardar cambios" : "Crear categoría"}
        </button>
      </div>
    </div>
  )
}
