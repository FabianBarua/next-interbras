"use client"

import { useTransition } from "react"
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
import { Badge } from "@/components/ui/badge"
import { CategoryIcon } from "@/components/dashboard/icon-picker"
import { Search, Pencil, Trash2 } from "lucide-react"
import { useTableParams } from "@/hooks/use-table-params"
import { useSearch } from "@/hooks/use-search"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete, bulkActivate, bulkDeactivate } from "@/components/dashboard/bulk-bar"

interface Props {
  categories: Category[]
  total: number
  totalPages: number
  perPage: number
}

export function CategoriesTable({
  categories,
  total,
  totalPages,
  perPage: defaultPerPage,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const search = useSearch()

  // Active filter
  const activeFilter = searchParams.get("active") ?? ""
  const setActiveFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("active", val)
    else params.delete("active")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const { sortBy, sortDir, setSort, page, setPage, perPage, setPerPage } = useTableParams({
    sortBy: "sortOrder",
    sortDir: "asc",
    perPage: defaultPerPage,
  })

  const bulkActions = [
    bulkActivate(async (ids) => { await bulkToggleCategoriesAction(ids, true); router.refresh() }),
    bulkDeactivate(async (ids) => { await bulkToggleCategoriesAction(ids, false); router.refresh() }),
    bulkDelete(async (ids) => { await bulkDeleteCategoriesAction(ids); router.refresh() }, { entityName: "categoría(s)" }),
  ]

  const columns: Column<Category>[] = [
    {
      key: "icon",
      header: "",
      headerClassName: "w-14",
      cell: (cat) =>
        cat.svgIconMeta ? (
          <CategoryIcon meta={cat.svgIconMeta} size={24} className="text-muted-foreground" />
        ) : cat.image ? (
          <Image src={cat.image} alt="" width={32} height={32} className="rounded object-cover" />
        ) : (
          <div className="size-8 rounded bg-muted" />
        ),
    },
    {
      key: "name",
      header: "Nombre",
      sortable: true,
      cell: (cat) => (
        <Link href={`/dashboard/categories/${cat.id}`} className="hover:underline">
          <p className="font-medium">{cat.name.es || cat.name.pt || "—"}</p>
          {cat.name.pt && cat.name.es && (
            <p className="text-xs text-muted-foreground">{cat.name.pt}</p>
          )}
        </Link>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      className: "text-muted-foreground",
      cell: (cat) => <>{cat.slug}</>,
    },
    {
      key: "sortOrder",
      header: "Orden",
      sortable: true,
      align: "center" as const,
      className: "tabular-nums",
      cell: (cat) => <>{cat.sortOrder}</>,
    },
    {
      key: "active",
      header: "Estado",
      sortable: true,
      align: "center" as const,
      cell: (cat) => (
        <button
          onClick={() =>
            startTransition(async () => {
              await updateCategoryAction(cat.id, { active: !cat.active })
              router.refresh()
            })
          }
          title={cat.active ? "Desactivar" : "Activar"}
        >
          <Badge
            variant={cat.active ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {cat.active ? "Activa" : "Inactiva"}
          </Badge>
        </button>
      ),
    },
  ]

  const onDelete = async (id: string) => {
    await deleteCategoryAction(id)
    router.refresh()
  }

  return (
    <DataTable
      tableId="categories"
      resizable
      data={categories}
      columns={columns}
      getId={(cat) => cat.id}
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
              placeholder="Buscar por nombre, slug..."
              className="h-9 w-72 rounded-lg border pl-9 pr-3 text-sm"
            />
          </div>
          {[
            { label: "Todas", value: "" },
            { label: "Activas", value: "true" },
            { label: "Inactivas", value: "false" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                activeFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </>
      }
      renderActions={(cat, { handleDelete }) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/dashboard/categories/${cat.id}`}
            title="Editar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(cat.id)}
            title="Eliminar"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      onDelete={onDelete}
      deleteTitle="¿Eliminar categoría?"
      page={page}
      totalPages={totalPages}
      total={total}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={setPerPage}
      emptyMessage="No se encontraron categorías."
    />
  )
}
