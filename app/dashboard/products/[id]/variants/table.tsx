"use client"

import { useState, useTransition, useMemo } from "react"
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
import { PER_PAGE_OPTIONS } from "@/hooks/use-table-params"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete, bulkActivate, bulkDeactivate } from "@/components/dashboard/bulk-bar"

type SortKey = "code" | "unitsPerBox" | "stock" | "active" | "sortOrder"

export function VariantsTable({
  productId,
  initialVariants,
}: {
  productId: string
  initialVariants: AdminVariant[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Client-side sort state
  const [sortBy, setSortBy] = useState<SortKey>("sortOrder")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<number>(PER_PAGE_OPTIONS[2])

  const handleSort = (col: string) => {
    const key = col as SortKey
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const sorted = useMemo(() => {
    return [...initialVariants].sort((a, b) => {
      let cmp = 0
      if (sortBy === "code") cmp = (a.externalCode?.code ?? "").localeCompare(b.externalCode?.code ?? "")
      else if (sortBy === "unitsPerBox") cmp = (a.unitsPerBox ?? 0) - (b.unitsPerBox ?? 0)
      else if (sortBy === "stock") cmp = (a.externalCode?.stock ?? -1) - (b.externalCode?.stock ?? -1)
      else if (sortBy === "active") cmp = Number(a.active) - Number(b.active)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [initialVariants, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paged = sorted.slice((page - 1) * perPage, page * perPage)

  const handleToggleActive = (id: string, active: boolean) => {
    startTransition(async () => {
      await updateVariantAction(id, productId, { active })
      router.refresh()
    })
  }

  const bulkActions = [
    bulkActivate(async (ids) => { await bulkToggleVariantsAction(ids, true); router.refresh() }),
    bulkDeactivate(async (ids) => { await bulkToggleVariantsAction(ids, false); router.refresh() }),
    bulkDelete(async (ids) => { await bulkDeleteVariantsAction(ids); router.refresh() }, { entityName: "variante(s)" }),
  ]

  const columns: Column<AdminVariant>[] = [
    {
      key: "imgCol",
      header: "Img",
      cell: (v) =>
        v.images[0]?.url ? (
          <div className="relative w-10 h-10 rounded border bg-muted/30 overflow-hidden">
            <Image src={v.images[0].url} alt="" fill className="object-contain p-0.5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded border bg-muted/30" />
        ),
    },
    {
      key: "code",
      header: "Código (SKU)",
      sortable: true,
      className: "font-mono text-xs",
      cell: (v) => <>{v.externalCode?.code ?? "—"}</>,
    },
    {
      key: "attributes",
      header: "Atributos",
      className: "text-xs text-muted-foreground",
      cell: (v) => (
        <>
          {v.attributeValues.map((av) => (
            <span key={av.valueId} className="inline-block mr-2">
              {av.attributeName.es ?? av.attributeSlug}: <strong>{av.valueName.es ?? av.valueSlug}</strong>
            </span>
          ))}
        </>
      ),
    },
    {
      key: "unitsPerBox",
      header: "Uds.Caja",
      sortable: true,
      align: "center" as const,
      cell: (v) => <>{v.unitsPerBox ?? "—"}</>,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      align: "center" as const,
      cell: (v) => <>{v.externalCode?.stock ?? "—"}</>,
    },
    {
      key: "active",
      header: "Activo",
      sortable: true,
      align: "center" as const,
      cell: (v) => (
        <button
          onClick={() => handleToggleActive(v.id, !v.active)}
          disabled={isPending}
          className={`w-10 h-5 rounded-full transition-colors ${
            v.active ? "bg-green-500" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
              v.active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      ),
    },
  ]

  const onDelete = async (id: string) => {
    await deleteVariantAction(id)
    router.refresh()
  }

  return (
    <DataTable
      tableId="product-variants"
      resizable
      data={paged}
      columns={columns}
      getId={(v) => v.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={handleSort}
      bulkActions={bulkActions}
      renderActions={(v, { handleDelete }) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard/products/${productId}/variants/${v.id}`}
            title="Editar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(v.id)}
            title="Eliminar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      onDelete={onDelete}
      deleteTitle="¿Eliminar variante?"
      page={page}
      totalPages={totalPages}
      total={sorted.length}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(p) => {
        setPerPage(p)
        setPage(1)
      }}
      emptyMessage="No hay variantes."
    />
  )
}
