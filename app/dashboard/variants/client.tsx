"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { AdminVariantGlobal } from "@/services/admin/variants-global"
import type { Category } from "@/types/category"
import { bulkDeleteVariantsAction, bulkToggleVariantsAction } from "@/lib/actions/admin/variants"
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs"
import { PageHeader } from "@/components/dashboard/page-header"
import { Toolbar, ToolbarButton } from "@/components/dashboard/toolbar"

export function VariantsGlobalClient({ initialVariants, categories, search, categoryId }: {
  initialVariants: AdminVariantGlobal[]; categories: Category[]; search: string; categoryId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchVal, setSearchVal] = useState(search)
  const items = initialVariants

  const applyFilters = (overrides?: { search?: string; categoryId?: string }) => {
    const params = new URLSearchParams()
    const s = overrides?.search ?? searchVal
    const c = overrides?.categoryId ?? categoryId
    if (s) params.set("search", s)
    if (c) params.set("categoryId", c)
    router.push(`/dashboard/variants?${params.toString()}`)
  }

  const handleBulk = (action: string) => {
    const ids = Array.from(selected)
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} variante(s)?`)) return
    startTransition(async () => {
      if (action === "delete") await bulkDeleteVariantsAction(ids)
      else await bulkToggleVariantsAction(ids, action === "activate")
      setSelected(new Set())
      router.refresh()
    })
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
      <Breadcrumbs items={[{ label: "Variantes" }]} />
      <PageHeader label="Todas las Variantes">
        Vista global de variantes de todos los productos. {items.length} variante(s).
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applyFilters()}
          placeholder="Buscar SKU, producto, opción..."
          className="h-9 w-64 rounded-lg border px-3 text-sm"
        />
        <button onClick={() => applyFilters()} className="h-9 px-3 border rounded-lg text-sm hover:bg-muted">Buscar</button>
        <select
          value={categoryId}
          onChange={e => applyFilters({ categoryId: e.target.value })}
          className="h-9 rounded-lg border px-2 text-sm"
        >
          <option value="">Todas categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name.es ?? c.slug}</option>)}
        </select>
        {(search || categoryId) && (
          <button onClick={() => { setSearchVal(""); router.push("/dashboard/variants") }} className="text-sm text-muted-foreground hover:text-foreground">
            Limpiar
          </button>
        )}
        <div className="flex-1" />
        <Toolbar
          selected={selected.size}
          bulkActions={[
            { label: "Activar", value: "activate" },
            { label: "Desactivar", value: "deactivate" },
            { label: "Eliminar", value: "delete", destructive: true },
          ]}
          onBulkAction={handleBulk}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Img</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">SKU</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Producto</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Categoría</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Opciones</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Stock</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">USD</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Gs</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">BRL</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-muted-foreground">Activo</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Ir a</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="rounded" /></td>
                <td className="px-3 py-2">
                  {v.imageUrl ? (
                    <div className="w-9 h-9 relative rounded overflow-hidden bg-muted/30">
                      <Image src={v.imageUrl} alt="" fill className="object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground">—</div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs font-medium">{v.sku}</td>
                <td className="px-3 py-2">
                  <Link href={`/dashboard/products/${v.productId}`} className="text-xs text-primary hover:underline">
                    {v.productName.es ?? v.productSlug}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{v.categoryName?.es ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(v.options).map(([k, val]) => (
                      <span key={k} className="text-[10px] bg-muted rounded px-1.5 py-0.5">{k}: {val}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{v.stock ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{v.priceUsd ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{v.priceGs ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{v.priceBrl ?? "—"}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${v.active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/dashboard/products/${v.productId}/variants`} className="text-xs text-primary hover:underline">
                    Variantes →
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-12 text-muted-foreground">
                  {search || categoryId ? "Sin resultados." : "No hay variantes en el sistema."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
