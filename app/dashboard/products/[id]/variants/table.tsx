"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { AdminVariant } from "@/services/admin/variants"
import {
  updateVariantAction,
  deleteVariantAction,
  bulkDeleteVariantsAction,
  bulkToggleVariantsAction,
} from "@/lib/actions/admin/variants"
import { Pencil, Trash2 } from "lucide-react"

export function VariantsTable({
  productId,
  initialVariants,
}: {
  productId: string
  initialVariants: AdminVariant[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const items = initialVariants

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }
  const toggle = (id: string) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const handleBulk = (action: "activate" | "deactivate" | "delete") => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} variante(s)?`)) return
    startTransition(async () => {
      if (action === "delete") await bulkDeleteVariantsAction(ids)
      else await bulkToggleVariantsAction(ids, action === "activate")
      setSelected(new Set())
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta variante?")) return
    startTransition(async () => {
      await deleteVariantAction(id)
      router.refresh()
    })
  }

  const handleToggleActive = (id: string, active: boolean) => {
    startTransition(async () => {
      await updateVariantAction(id, productId, { active })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{selected.size} sel.</span>
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) handleBulk(e.target.value as any); e.target.value = "" }}
            className="h-9 rounded-lg border px-2 text-sm"
          >
            <option value="" disabled>Acción masiva…</option>
            <option value="activate">Activar</option>
            <option value="deactivate">Desactivar</option>
            <option value="delete">Eliminar</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-10 px-3 py-2">
                <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-3 py-2 text-left font-medium">Img</th>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-left font-medium">Opciones</th>
              <th className="px-3 py-2 text-right font-medium">Stock</th>
              <th className="px-3 py-2 text-right font-medium">Uds/Caja</th>
              <th className="px-3 py-2 text-right font-medium">USD</th>
              <th className="px-3 py-2 text-right font-medium">Gs</th>
              <th className="px-3 py-2 text-right font-medium">BRL</th>
              <th className="px-3 py-2 text-center font-medium">Activo</th>
              <th className="px-3 py-2 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="rounded" /></td>
                <td className="px-3 py-2">
                  {v.images[0] ? (
                    <div className="w-10 h-10 relative rounded overflow-hidden bg-muted/30">
                      <Image src={v.images[0].url} alt="" fill className="object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">—</div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(v.options).map(([k, val]) => (
                      <span key={k} className="text-xs bg-muted rounded px-1.5 py-0.5">{k}: {val}</span>
                    ))}
                    {Object.keys(v.options).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{v.stock ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{v.unitsPerBox ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{v.externalCode?.priceUsd ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{v.externalCode?.priceGs ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{v.externalCode?.priceBrl ?? "—"}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => handleToggleActive(v.id, !v.active)}
                    disabled={isPending}
                    className={`w-8 h-5 rounded-full relative transition-colors ${v.active ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${v.active ? "left-3.5" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/products/${productId}/variants/${v.id}`} title="Editar" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                    <button onClick={() => handleDelete(v.id)} disabled={isPending} title="Eliminar" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">No hay variantes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
