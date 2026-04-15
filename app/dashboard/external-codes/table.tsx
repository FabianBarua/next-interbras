"use client"

import { useState, useTransition, useCallback, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { AdminExternalCode } from "@/services/admin/external-codes"
import {
  deleteExternalCodeAction,
  bulkUpdatePricesAction,
} from "@/lib/actions/admin/external-codes"
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
import { Search, Loader2, Trash2, Pencil } from "lucide-react"

interface Props {
  codes: AdminExternalCode[]
  total: number
  page: number
  totalPages: number
  systems: string[]
}

export function ExternalCodesTable({
  codes,
  total,
  page,
  totalPages,
  systems,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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

  // System filter
  const currentSystem = searchParams.get("system") ?? ""
  const setSystemFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("system", val)
    else params.delete("system")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggleAll = () => {
    if (selected.size === codes.length) setSelected(new Set())
    else setSelected(new Set(codes.map((c) => c.id)))
  }
  const toggle = (id: string) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = useCallback(
    (id: string) => {
      setDeleteId(id)
      setDeleteDialog(true)
    },
    []
  )

  const confirmDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      await deleteExternalCodeAction(deleteId)
      setDeleteDialog(false)
      setDeleteId(null)
      router.refresh()
    })
  }

  // Bulk delete
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)
  const confirmBulkDelete = () => {
    const ids = Array.from(selected)
    startTransition(async () => {
      for (const id of ids) {
        await deleteExternalCodeAction(id)
      }
      setBulkDeleteDialog(false)
      setSelected(new Set())
      router.refresh()
    })
  }

  // Pagination
  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) params.set("page", String(p))
    else params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar código, SKU, producto..."
            className="h-9 w-72 rounded-lg border pl-9 pr-3 text-sm"
          />
        </div>

        {/* System filter chips */}
        <button
          onClick={() => setSystemFilter("")}
          className={`h-8 rounded-full px-3 text-xs font-medium transition ${
            !currentSystem
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {systems.map((sys) => (
          <button
            key={sys}
            onClick={() => setSystemFilter(sys)}
            className={`h-8 rounded-full px-3 text-xs font-medium uppercase transition ${
              currentSystem === sys
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {sys}
          </button>
        ))}

        <div className="flex-1" />

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <span className="text-xs font-medium">
              {selected.size} seleccionado{selected.size !== 1 ? "s" : ""}
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={codes.length > 0 && selected.size === codes.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                Sistema
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                Código
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                Nombre ext.
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                Variante (SKU)
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                Producto
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                Stock
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                USD
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                Gs
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                BRL
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.map((ec) => (
              <tr
                key={ec.id}
                className="border-b last:border-b-0 hover:bg-muted/20"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(ec.id)}
                    onChange={() => toggle(ec.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {ec.system}
                  </Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{ec.code}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">
                  {ec.externalName ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {ec.productId && ec.variantSku ? (
                    <Link
                      href={`/dashboard/products/${ec.productId}/variants`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {ec.variantSku}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {ec.productId && ec.productName ? (
                    <>
                      <Link
                        href={`/dashboard/products/${ec.productId}`}
                        className="text-xs hover:underline"
                      >
                        {ec.productName.es ?? ec.productSlug}
                      </Link>
                      {ec.categoryName && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          ({ec.categoryName.es})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin vincular</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {ec.stock ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {ec.priceUsd ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {ec.priceGs ?? "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {ec.priceBrl ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/external-codes/${ec.id}`}
                      title="Editar"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(ec.id)}
                      title="Eliminar"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-muted-foreground"
                >
                  {searchValue || currentSystem
                    ? "Sin resultados para los filtros aplicados."
                    : "No hay códigos externos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} código
            {total !== 1 ? "s" : ""} en total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Delete single dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar código externo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={confirmDelete}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete dialog */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Eliminar {selected.size} código{selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={confirmBulkDelete}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Eliminar {selected.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
