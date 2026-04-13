"use client"

import { useState, useTransition, useCallback, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Category } from "@/types/category"
import {
  updateCategoryAction,
  deleteCategoryAction,
  bulkDeleteCategoriesAction,
  bulkToggleCategoriesAction,
} from "@/lib/actions/admin/categories"
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
import { CategoryIcon } from "@/components/dashboard/icon-picker"
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Pencil,
} from "lucide-react"

interface Props {
  categories: Category[]
  total: number
  page: number
  totalPages: number
  sortBy: string
  sortOrder: string
}

export function CategoriesTable({
  categories,
  total,
  page,
  totalPages,
  sortBy,
  sortOrder,
}: Props) {
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

  // Active filter
  const activeFilter = searchParams.get("active") ?? ""
  const setActiveFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("active", val)
    else params.delete("active")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = categories.length > 0 && categories.every((c) => selected.has(c.id))
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.id)))
  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  // Sorting
  const handleSort = useCallback(
    (col: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (sortBy === col) {
        params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc")
      } else {
        params.set("sortBy", col)
        params.set("sortOrder", "asc")
      }
      params.delete("page")
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [router, pathname, searchParams, sortBy, sortOrder, startTransition],
  )

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="size-3" />
    return sortOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
  }

  // Pagination
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set("page", String(p))
    else params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Bulk actions
  const [bulkDialog, setBulkDialog] = useState<"delete" | "activate" | "deactivate" | null>(null)
  const [busy, setBusy] = useState(false)

  const handleBulk = async () => {
    if (selected.size === 0) return
    setBusy(true)
    const ids = [...selected]
    if (bulkDialog === "delete") {
      await bulkDeleteCategoriesAction(ids)
    } else if (bulkDialog === "activate") {
      await bulkToggleCategoriesAction(ids, true)
    } else if (bulkDialog === "deactivate") {
      await bulkToggleCategoriesAction(ids, false)
    }
    setBusy(false)
    setBulkDialog(null)
    setSelected(new Set())
    router.refresh()
  }

  return (
    <>
      {/* Filters row */}
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
        <div className="flex gap-1">
          {[
            { label: "Todas", value: "" },
            { label: "Activas", value: "true" },
            { label: "Inactivas", value: "false" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} seleccionada(s)</span>
          <Button size="sm" variant="outline" onClick={() => setBulkDialog("activate")}>
            <ToggleRight className="mr-1.5 size-3.5" /> Activar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkDialog("deactivate")}>
            <ToggleLeft className="mr-1.5 size-3.5" /> Desactivar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkDialog("delete")}>
            <Trash2 className="mr-1.5 size-3.5" /> Eliminar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">
            Deseleccionar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-3.5 rounded border-input"
                  />
                </th>
                <th className="w-14 px-2 py-3" />
                <th className="text-left px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Nombre <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("slug")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Slug <SortIcon col="slug" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("sortOrder")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Orden <SortIcon col="sortOrder" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort("active")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Estado <SortIcon col="active" />
                  </button>
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron categorías.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className={`border-b last:border-0 transition-colors ${
                    selected.has(cat.id) ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(cat.id)}
                      onChange={() => toggle(cat.id)}
                      className="size-3.5 rounded border-input"
                    />
                  </td>
                  <td className="px-2 py-3">
                    {cat.svgIconMeta ? (
                      <CategoryIcon meta={cat.svgIconMeta} size={24} className="text-muted-foreground" />
                    ) : cat.image ? (
                      <Image
                        src={cat.image}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded bg-muted" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/categories/${cat.id}`} className="hover:underline">
                      <p className="font-medium">{cat.name.es || cat.name.pt || "—"}</p>
                      {cat.name.pt && cat.name.es && (
                        <p className="text-xs text-muted-foreground">{cat.name.pt}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cat.slug}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{cat.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => startTransition(async () => { await updateCategoryAction(cat.id, { active: !cat.active }); router.refresh() })}
                      title={cat.active ? "Desactivar" : "Activar"}
                    >
                      <Badge variant={cat.active ? "default" : "secondary"} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {cat.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/categories/${cat.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary + pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} categoría{total !== 1 ? "s" : ""} — página {page} de {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk action dialog */}
      <Dialog open={!!bulkDialog} onOpenChange={(v) => !v && setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkDialog === "delete"
                ? `Eliminar ${selected.size} categoría(s)`
                : bulkDialog === "activate"
                ? `Activar ${selected.size} categoría(s)`
                : `Desactivar ${selected.size} categoría(s)`}
            </DialogTitle>
            <DialogDescription>
              {bulkDialog === "delete"
                ? "Esta acción no se puede deshacer. Las categorías con productos asociados no se eliminarán."
                : "Se cambiará el estado de las categorías seleccionadas."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant={bulkDialog === "delete" ? "destructive" : "default"}
              onClick={handleBulk}
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
