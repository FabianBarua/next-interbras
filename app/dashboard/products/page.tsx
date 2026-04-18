import { requireAdmin } from "@/lib/auth/get-session"
import { searchProductsAdmin } from "@/services/admin/products"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { ProductsTable } from "./table"
import { parsePerPage, perPageToLimit } from "@/lib/pagination"
import Link from "next/link"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] : "") ?? ""

  const page = Math.max(1, Number(str("page")) || 1)
  const perPage = parsePerPage(str("perPage"))
  const search = str("search") || undefined
  const categoryId = str("categoryId") || undefined
  const sortBy = str("sortBy") || "name"
  const sortDir = str("sortDir") || "asc"

  const [result, categories] = await Promise.all([
    searchProductsAdmin({ page, limit: perPageToLimit(perPage), search, categoryId, sortBy, sortDir }),
    getAllCategoriesAdmin(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} producto{result.total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo producto
        </Link>
      </div>
      <ProductsTable
        items={result.items}
        categories={categories}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        perPage={perPage}
      />
    </div>
  )
}
