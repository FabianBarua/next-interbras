import { requireAdmin } from "@/lib/auth/get-session"
import { searchVariantsGlobal } from "@/services/admin/variants-global"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { VariantsTable } from "./table"

export default async function VariantesGlobalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] : "") ?? ""

  const page = Math.max(1, Number(str("page")) || 1)
  const perPage = Math.min(100, Math.max(10, Number(str("perPage")) || 50))
  const search = str("search") || undefined
  const categoryId = str("categoryId") || undefined
  const sortBy = str("sortBy") || "product"
  const sortDir = str("sortDir") || "asc"

  const [result, categories] = await Promise.all([
    searchVariantsGlobal({ page, limit: perPage, search, categoryId, sortBy, sortOrder: sortDir }),
    getAllCategoriesAdmin(),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Variantes</h1>
        <p className="text-sm text-muted-foreground">
          {result.total} variante{result.total !== 1 ? "s" : ""} en total
        </p>
      </div>

      <VariantsTable
        variants={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        perPage={perPage}
        categories={categories}
      />
    </div>
  )
}
