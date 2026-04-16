"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { AdminAttribute } from "@/services/admin/attributes"
import { bulkDeleteAttributesAction, deleteAttributeAction, updateAttributeAction } from "@/lib/actions/admin/attributes"
import { Badge } from "@/components/ui/badge"
import { Search, Pencil, Trash2 } from "lucide-react"
import { useTableParams } from "@/hooks/use-table-params"
import { useSearch } from "@/hooks/use-search"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete } from "@/components/dashboard/bulk-bar"

interface Props {
  attributes: AdminAttribute[]
  total: number
  totalPages: number
  perPage: number
}

export function AttributesTable({ attributes, total, totalPages, perPage: defaultPerPage }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const search = useSearch()

  const { sortBy, sortDir, setSort, page, setPage, perPage, setPerPage } = useTableParams({
    sortBy: "sortOrder",
    sortDir: "asc",
    perPage: defaultPerPage,
  })

  const bulkActions = [
    bulkDelete(async (ids) => { await bulkDeleteAttributesAction(ids); router.refresh() }, { entityName: "atributo(s)" }),
  ]

  const columns: Column<AdminAttribute>[] = [
    {
      key: "name",
      header: "Nombre",
      sortable: true,
      cell: (attr) => (
        <Link href={`/dashboard/attributes/${attr.id}`} className="hover:underline">
          <p className="font-medium">{attr.name.es || attr.name.pt || "—"}</p>
          {attr.name.pt && attr.name.es && (
            <p className="text-xs text-muted-foreground">{attr.name.pt}</p>
          )}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      className: "text-muted-foreground",
      cell: (attr) => <>{attr.slug}</>,
    },
    {
      key: "values",
      header: "Valores",
      align: "center" as const,
      cell: (attr) => <Badge variant="secondary">{attr.valueCount}</Badge>,
    },
    {
      key: "sortOrder",
      header: "Orden",
      sortable: true,
      align: "center" as const,
      className: "tabular-nums",
      cell: (attr) => <>{attr.sortOrder}</>,
    },
    {
      key: "active",
      header: "Estado",
      align: "center" as const,
      cell: (attr) => (
        <button
          onClick={() =>
            startTransition(async () => {
              await updateAttributeAction(attr.id, { active: !attr.active })
              router.refresh()
            })
          }
          title={attr.active ? "Desactivar" : "Activar"}
        >
          <Badge
            variant={attr.active ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {attr.active ? "Activo" : "Inactivo"}
          </Badge>
        </button>
      ),
    },
  ]

  const onDelete = async (id: string) => {
    await deleteAttributeAction(id)
    router.refresh()
  }

  return (
    <DataTable
      tableId="attributes"
      resizable
      data={attributes}
      columns={columns}
      getId={(attr) => attr.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={setSort}
      bulkActions={bulkActions}
      toolbar={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search.value}
            onChange={(e) => search.setValue(e.target.value)}
            placeholder="Buscar por nombre, slug..."
            className="h-9 w-72 rounded-lg border pl-9 pr-3 text-sm"
          />
        </div>
      }
      renderActions={(attr, { handleDelete }) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard/attributes/${attr.id}`}
            title="Editar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(attr.id)}
            title="Eliminar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      onDelete={onDelete}
      deleteTitle="¿Eliminar atributo?"
      page={page}
      totalPages={totalPages}
      total={total}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={setPerPage}
      emptyMessage="No se encontraron atributos."
    />
  )
}
