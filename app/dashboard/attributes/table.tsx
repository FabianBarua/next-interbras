"use client"

import { useState, useTransition, useCallback, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { AdminAttribute } from "@/services/admin/attributes"
import { bulkDeleteAttributesAction } from "@/lib/actions/admin/attributes"
import { updateAttributeAction } from "@/lib/actions/admin/attributes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Loader2, Trash2, Pencil } from "lucide-react"

interface Props {
  attributes: AdminAttribute[]
  total: number
  page: number
  totalPages: number
  sortBy: string
  sortOrder: string
}

export function AttributesTable({ attributes, total, page, totalPages, sortBy, sortOrder }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Search
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue) params.set("search", searchValue)
      else params.delete("search")
      params.delete("page")
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = attributes.length > 0 && attributes.every((a) => selected.has(a.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(attributes.map((a) => a.id)))
  const toggle = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  // Sorting
  const handleSort = useCallback((col: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortBy === col) params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc")
    else { params.set("sortBy", col); params.set("sortOrder", "asc") }
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParams, sortBy, sortOrder, startTransition])

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="size-3" />
    return sortOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
  }

  // Pagination
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set("page", String(p)); else params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Bulk
  const [bulkOpen, setBulkOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const handleBulkDelete = async () => {
    setBusy(true)
    await bulkDeleteAttributesAction([...selected])
    setBusy(false)
    setBulkOpen(false)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por nombre, slug..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} seleccionado(s)</span>
          <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
            <Trash2 className="mr-1.5 size-3.5" /> Eliminar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">
            Deseleccionar
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-3.5 rounded border-input" />
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => handleSort("name")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Nombre <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button onClick={() => handleSort("slug")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Slug <SortIcon col="slug" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium">Valores</th>
                <th className="text-center px-4 py-3 font-medium">
                  <button onClick={() => handleSort("sortOrder")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Orden <SortIcon col="sortOrder" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {attributes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No se encontraron atributos.</td></tr>
              )}
              {attributes.map((attr) => (
                <tr key={attr.id} className={`border-b last:border-0 transition-colors ${selected.has(attr.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(attr.id)} onChange={() => toggle(attr.id)} className="size-3.5 rounded border-input" />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/attributes/${attr.id}`} className="hover:underline">
                      <p className="font-medium">{attr.name.es || attr.name.pt || "—"}</p>
                      {attr.name.pt && attr.name.es && <p className="text-xs text-muted-foreground">{attr.name.pt}</p>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{attr.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary">{attr.valueCount}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{attr.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => startTransition(async () => { await updateAttributeAction(attr.id, { active: !attr.active }); router.refresh() })}
                      title={attr.active ? "Desactivar" : "Activar"}
                    >
                      <Badge variant={attr.active ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">{attr.active ? "Activo" : "Inactivo"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/attributes/${attr.id}`} title="Editar" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} atributo{total !== 1 ? "s" : ""} — página {page} de {totalPages}</span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Siguiente</Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {selected.size} atributo(s)</DialogTitle>
            <DialogDescription>Esta acción eliminará los atributos y todos sus valores. No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
