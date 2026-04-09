"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Category } from "@/types/category"
import type { AdminProduct } from "@/services/admin/products"
import {
  deleteProductAction,
  updateProductAction,
  bulkDeleteProductsAction,
  bulkToggleProductsAction,
} from "@/lib/actions/admin/products"

export function ProductsTable({ items, categories }: { items: AdminProduct[]; categories: Category[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState("")
  const [filterCat, setFilterCat] = useState("")

  const filtered = filterCat ? items.filter(i => i.categoryId === filterCat) : items

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(i => i.id)))
  }

  const handleBulk = () => {
    if (!bulkAction || selected.size === 0) return
    startTransition(async () => {
      const ids = Array.from(selected)
      if (bulkAction === "delete") {
        if (!confirm(`¿Eliminar ${ids.length} producto(s)?`)) return
        await bulkDeleteProductsAction(ids)
      } else if (bulkAction === "activate") {
        await bulkToggleProductsAction(ids, true)
      } else if (bulkAction === "deactivate") {
        await bulkToggleProductsAction(ids, false)
      }
      setSelected(new Set())
      setBulkAction("")
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este producto y todas sus variantes?")) return
    startTransition(async () => {
      const res = await deleteProductAction(id)
      if ("error" in res) setError(res.error!)
      router.refresh()
    })
  }

  const handleToggle = (item: AdminProduct) => {
    startTransition(async () => {
      await updateProductAction(item.id, { active: !item.active })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/dashboard/products/new" className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 inline-flex items-center">
          + Nuevo producto
        </Link>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-9 rounded-lg border px-2 text-sm">
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name.es ?? c.slug}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.size} seleccionado(s)</span>
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
              <th className="w-10 px-3 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              <th className="w-14 px-3 py-3 text-left font-medium">Img</th>
              <th className="px-3 py-3 text-left font-medium">Slug</th>
              <th className="px-3 py-3 text-left font-medium">Nombre (ES)</th>
              <th className="px-3 py-3 text-left font-medium">Nombre (PT)</th>
              <th className="px-3 py-3 text-left font-medium">Categoría</th>
              <th className="px-3 py-3 text-center font-medium">Variantes</th>
              <th className="px-3 py-3 text-center font-medium">Activo</th>
              <th className="px-3 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-center"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                <td className="px-3 py-2">
                  {item.imageUrl ? (
                    <div className="relative w-10 h-10 rounded border bg-muted/30 overflow-hidden">
                      <Image src={item.imageUrl} alt="" fill className="object-contain p-0.5" />
                    </div>
                  ) : <div className="w-10 h-10 rounded border bg-muted/30" />}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{item.slug}</td>
                <td className="px-3 py-2 font-medium">{item.name.es ?? "—"}</td>
                <td className="px-3 py-2">{item.name.pt ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{item.categoryName?.es ?? "—"}</td>
                <td className="px-3 py-2 text-center">
                  <Link href={`/dashboard/products/${item.id}/variants`} className="text-primary hover:underline font-medium">
                    {item.variantCount}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => handleToggle(item)} disabled={isPending}
                    className={`inline-flex h-6 w-10 items-center rounded-full transition-colors ${item.active ? "bg-green-500" : "bg-muted"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${item.active ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <Link href={`/dashboard/products/${item.id}`} className="text-xs text-primary hover:underline">Editar</Link>
                  <Link href={`/dashboard/products/${item.id}/variants`} className="text-xs text-primary hover:underline">Variantes</Link>
                  <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-xs text-destructive hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No hay productos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}


