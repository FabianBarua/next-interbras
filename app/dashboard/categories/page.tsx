import { requireAdmin } from "@/lib/auth/get-session"
import { searchCategories } from "@/services/admin/categories"
import { CategoriesTable } from "./table"
import Link from "next/link"

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] : "") ?? ""

  const page = Math.max(1, Number(str("page")) || 1)
  const search = str("search") || undefined
  const activeFilter = str("active")
  const sortBy = str("sortBy") || "sortOrder"
  const sortOrder = str("sortOrder") || "asc"

  const result = await searchCategories({
    page,
    limit: 50,
    search,
    active: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
    sortBy,
    sortOrder,
  })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} categoría{result.total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/categories/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nueva categoría
        </Link>
      </div>

      <CategoriesTable
        categories={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
