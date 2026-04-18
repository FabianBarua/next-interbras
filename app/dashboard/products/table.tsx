"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Category } from "@/types/category"
import type { AdminProduct } from "@/services/admin/products"
import { deleteProductAction, bulkDeleteProductsAction } from "@/lib/actions/admin/products"
import { Pencil, Trash2, Package, Search } from "lucide-react"
import { useTableParams } from "@/hooks/use-table-params"
import { useSearch } from "@/hooks/use-search"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { bulkDelete } from "@/components/dashboard/bulk-bar"

interface Props {
  items: AdminProduct[]
  categories: Category[]
  total: number
  page: number
  totalPages: number
  perPage: number
}

export function ProductsTable({ items, categories, total, totalPages, perPage: defaultPerPage }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const search = useSearch()

  const { sortBy, sortDir, setSort, page, setPage, perPage, setPerPage } = useTableParams({
    sortBy: "name",
    sortDir: "asc",
    perPage: defaultPerPage,
  })

  // Category filter
  const currentCat = searchParams.get("categoryId") ?? ""
  const setCatFilter = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("categoryId", val)
    else params.delete("categoryId")
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const bulkActions = [
    bulkDelete(async (ids) => { await bulkDeleteProductsAction(ids); router.refresh() }, { entityName: "producto(s)" }),
  ]

  const columns: Column<AdminProduct>[] = [
    {
      key: "img",
      header: "Img",
      headerClassName: "w-14",
      cell: (item) =>
        item.imageUrl ? (
          <div className="relative w-10 h-10 rounded border bg-muted/30 overflow-hidden">
            <Image src={item.imageUrl} alt="" fill className="object-contain p-0.5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded border bg-muted/30" />
        ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      className: "font-mono text-xs",
      cell: (item) => <>{item.slug}</>,
    },
    {
      key: "name",
      header: "Nombre (ES)",
      sortable: true,
      className: "font-medium",
      cell: (item) => <>{item.name.es ?? "—"}</>,
    },
    {
      key: "namePt",
      header: "Nombre (PT)",
      className: "text-muted-foreground",
      cell: (item) => <>{item.name.pt ?? "—"}</>,
    },
    {
      key: "category",
      header: "Categoría",
      className: "text-xs text-muted-foreground",
      cell: (item) => <>{item.categoryName?.es ?? "—"}</>,
    },
    {
      key: "active",
      header: "Estado",
      sortable: true,
      align: "center" as const,
      cell: (item) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            item.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {item.active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "variants",
      header: "Variantes",
      align: "center" as const,
      cell: (item) => (
        <Link
          href={`/dashboard/variants?productId=${item.id}`}
          className="text-primary hover:underline font-medium"
          title="Ver variantes en /dashboard/variants"
        >
          {item.variantCount}
        </Link>
      ),
    },
  ]

  const onDelete = async (id: string) => {
    const res = await deleteProductAction(id)
    if ("error" in res) setError(res.error!)
    router.refresh()
  }

  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DataTable
        tableId="products"
        resizable
        data={items}
        columns={columns}
        getId={(item) => item.id}
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
            <select
              value={currentCat}
              onChange={(e) => setCatFilter(e.target.value)}
              className="h-9 rounded-lg border px-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.es ?? c.slug}
                </option>
              ))}
            </select>
          </>
        }
        renderActions={(item, { handleDelete }) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/dashboard/products/${item.id}`}
              title="Editar"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="size-3.5" />
            </Link>
            <Link
              href={`/dashboard/variants?productId=${item.id}`}
              title="Variantes"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Package className="size-3.5" />
            </Link>
            <button
              onClick={() => handleDelete(item.id)}
              title="Eliminar"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
        onDelete={onDelete}
        deleteTitle="¿Eliminar producto?"
        deleteDescription="Se eliminarán todas las variantes asociadas. Esta acción no se puede deshacer."
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        emptyMessage="No hay productos."
      />
    </>
  )
}
