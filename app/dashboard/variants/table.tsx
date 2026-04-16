"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { AdminVariantGlobal } from "@/services/admin/variants-global"
import type { Category } from "@/types/category"
import { Badge } from "@/components/ui/badge"
import {
  updateVariantAction,
  bulkDeleteVariantsAction,
  bulkToggleVariantsAction,
} from "@/lib/actions/admin/variants"
import { Search, Pencil } from "lucide-react"
import { useTableParams } from "@/hooks/use-table-params"
import { useSearch } from "@/hooks/use-search"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete, bulkActivate, bulkDeactivate } from "@/components/dashboard/bulk-bar"

const fmtAmount = (v: string | number | null) =>
  v ? Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"

interface Props {
  variants: AdminVariantGlobal[]
  total: number
  page: number
  totalPages: number
  perPage: number
  categories: Category[]
}

export function VariantsTable({ variants, total, totalPages, perPage: defaultPerPage, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const search = useSearch()

  // Category filter
  const categoryId = searchParams.get("categoryId") ?? ""
  const setCategoryFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("categoryId", val)
    else params.delete("categoryId")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const { sortBy, sortDir, setSort, page, setPage, perPage, setPerPage } = useTableParams({
    sortBy: "product",
    sortDir: "asc",
    perPage: defaultPerPage,
  })

  const bulkActions = [
    bulkActivate(async (ids) => { await bulkToggleVariantsAction(ids, true); router.refresh() }),
    bulkDeactivate(async (ids) => { await bulkToggleVariantsAction(ids, false); router.refresh() }),
    bulkDelete(async (ids) => { await bulkDeleteVariantsAction(ids); router.refresh() }, { entityName: "variante(s)" }),
  ]

  const columns: Column<AdminVariantGlobal>[] = [
    {
      key: "imgCol",
      header: "",
      headerClassName: "w-14",
      cell: (v) =>
        v.imageUrl ? (
          <Image src={v.imageUrl} alt="" width={36} height={36} className="rounded object-cover" />
        ) : (
          <div className="size-9 rounded bg-muted" />
        ),
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      className: "font-mono text-xs",
      cell: (v) => <>{v.sku}</>,
    },
    {
      key: "product",
      header: "Producto",
      sortable: true,
      className: "font-medium",
      cell: (v) => <>{v.productName.es || v.productSlug}</>,
    },
    {
      key: "category",
      header: "Categoría",
      sortable: true,
      className: "text-muted-foreground text-xs",
      cell: (v) => <>{v.categoryName?.es ?? "—"}</>,
    },
    {
      key: "options",
      header: "Opciones",
      cell: (v) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(v.options).map(([k, val]) => (
            <Badge key={k} variant="secondary" className="text-[10px]">
              {k}: {val}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "usd",
      header: "USD",
      align: "right" as const,
      className: "tabular-nums text-xs",
      cell: (v) => <>{v.priceUsd ? `$${fmtAmount(v.priceUsd)}` : "—"}</>,
    },
    {
      key: "active",
      header: "Estado",
      sortable: true,
      align: "center" as const,
      cell: (v) => (
        <button
          onClick={() =>
            startTransition(async () => {
              await updateVariantAction(v.id, v.productId, { active: !v.active })
              router.refresh()
            })
          }
          title={v.active ? "Desactivar" : "Activar"}
        >
          <Badge
            variant={v.active ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {v.active ? "Activo" : "Inactivo"}
          </Badge>
        </button>
      ),
    },
  ]

  return (
    <DataTable
      tableId="variants"
      resizable
      data={variants}
      columns={columns}
      getId={(v) => v.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={setSort}
      bulkActions={bulkActions}
      toolbar={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search.value}
              onChange={(e) => search.setValue(e.target.value)}
              placeholder="Buscar por SKU, producto..."
              className="h-9 w-72 rounded-lg border pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.es || c.slug}
              </option>
            ))}
          </select>
        </>
      }
      renderActions={(v) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard/products/${v.productId}/variants/${v.id}`}
            title="Editar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </Link>
        </div>
      )}
      page={page}
      totalPages={totalPages}
      total={total}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={setPerPage}
      emptyMessage="No se encontraron variantes."
    />
  )
}
