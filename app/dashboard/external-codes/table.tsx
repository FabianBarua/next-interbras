"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import type { AdminExternalCode } from "@/services/admin/external-codes"
import {
  deleteExternalCodeAction,
  bulkDeleteExternalCodesAction,
} from "@/lib/actions/admin/external-codes"
import { Badge } from "@/components/ui/badge"
import { Search, Pencil, Trash2, Zap } from "lucide-react"
import { useTableParams } from "@/hooks/use-table-params"
import { useSearch } from "@/hooks/use-search"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete, type BulkAction } from "@/components/dashboard/bulk-bar"
import {
  FastAssignModal,
  type FastAssignItem,
} from "@/components/dashboard/fast-assign-modal"

interface Props {
  codes: AdminExternalCode[]
  total: number
  page: number
  totalPages: number
  perPage: number
  systems: string[]
}

export function ExternalCodesTable({
  codes,
  total,
  totalPages,
  perPage: defaultPerPage,
  systems,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const { sortBy, sortDir, setSort, page, setPage, perPage, setPerPage } = useTableParams({
    sortBy: "updatedAt",
    sortDir: "desc",
    perPage: defaultPerPage,
  })

  const search = useSearch()

  // Fast-assign modal state
  const [fastAssignItems, setFastAssignItems] = useState<FastAssignItem[]>([])
  const fastAssignOpen = fastAssignItems.length > 0

  // System filter
  const currentSystem = searchParams.get("system") ?? ""
  const setSystemFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("system", val)
    else params.delete("system")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const bulkActions: BulkAction[] = [
    {
      key: "fast-assign",
      label: "Fast Assign",
      variant: "default",
      icon: <Zap className="size-3.5" />,
      onExecute: async (ids) => {
        const items: FastAssignItem[] = ids
          .map((id) => codes.find((c) => c.id === id))
          .filter(Boolean)
          .map((ec) => ({
            id: ec!.id,
            system: ec!.system,
            code: ec!.code,
            externalName: ec!.externalName,
            currentVariantId: ec!.variantId,
            currentVariantSku: ec!.variantSku,
          }))
        setFastAssignItems(items)
      },
    },
    bulkDelete(async (ids) => { await bulkDeleteExternalCodesAction(ids); router.refresh() }, { entityName: "código(s)" }),
  ]

  const columns: Column<AdminExternalCode>[] = [
    {
      key: "system",
      header: "Sistema",
      sortable: true,
      cell: (ec) => (
        <Badge variant="secondary" className="uppercase text-[10px]">
          {ec.system}
        </Badge>
      ),
    },
    {
      key: "code",
      header: "Código",
      sortable: true,
      cell: (ec) => <span className="font-mono text-xs">{ec.code}</span>,
    },
    {
      key: "externalName",
      header: "Nombre ext.",
      cell: (ec) => (
        <span className="text-xs text-muted-foreground truncate block">
          {ec.externalName ?? "—"}
        </span>
      ),
    },
    {
      key: "variantSku",
      header: "Variante (SKU)",
      cell: (ec) =>
        ec.productId && ec.variantSku ? (
          <Link
            href={`/dashboard/products/${ec.productId}/variants`}
            className="font-mono text-xs text-primary hover:underline"
          >
            {ec.variantSku}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "product",
      header: "Producto",
      cell: (ec) =>
        ec.productId && ec.productName ? (
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
        ),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      align: "right" as const,
      className: "font-mono text-xs tabular-nums",
      cell: (ec) => <>{ec.stock ?? "—"}</>,
    },
    {
      key: "priceUsd",
      header: "USD",
      sortable: true,
      align: "right" as const,
      className: "font-mono text-xs tabular-nums",
      cell: (ec) => <>{ec.priceUsd ?? "—"}</>,
    },
    {
      key: "priceGs",
      header: "Gs",
      sortable: true,
      align: "right" as const,
      className: "font-mono text-xs tabular-nums",
      cell: (ec) => <>{ec.priceGs ?? "—"}</>,
    },
    {
      key: "priceBrl",
      header: "BRL",
      sortable: true,
      align: "right" as const,
      className: "font-mono text-xs tabular-nums",
      cell: (ec) => <>{ec.priceBrl ?? "—"}</>,
    },
  ]

  const onDelete = async (id: string) => {
    await deleteExternalCodeAction(id)
    router.refresh()
  }

  return (
    <>
      <DataTable
      tableId="external-codes"
      resizable
      data={codes}
      columns={columns}
      getId={(ec) => ec.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={setSort}
      bulkActions={bulkActions}
      toolbar={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search.value}
              onChange={(e) => search.setValue(e.target.value)}
              placeholder="Buscar código, SKU, producto..."
              className="h-9 w-72 rounded-lg border pl-9 pr-3 text-sm"
            />
          </div>
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
        </>
      }
      renderActions={(ec, { handleDelete }) => (
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
      )}
      onDelete={onDelete}
      deleteTitle="¿Eliminar código externo?"
      page={page}
      totalPages={totalPages}
      total={total}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={setPerPage}
      emptyMessage={
        search.value || currentSystem
          ? "Sin resultados para los filtros aplicados."
          : "No hay códigos externos."
      }
    />
    <FastAssignModal
      open={fastAssignOpen}
      onClose={() => setFastAssignItems([])}
      items={fastAssignItems}
      onComplete={() => router.refresh()}
    />
    </>
  )
}
