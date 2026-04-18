import { requireAdmin } from "@/lib/auth/get-session"
import { searchVariantsGlobal } from "@/services/admin/variants-global"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { VariantsTable } from "./table"
import { parsePerPage, perPageToLimit } from "@/lib/pagination"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function VariantesGlobalPage({
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
  const productId = str("productId") || undefined
  const sortBy = str("sortBy") || "product"
  const sortDir = str("sortDir") || "asc"

  const [result, categories, productInitial] = await Promise.all([
    searchVariantsGlobal({ page, limit: perPageToLimit(perPage), search, categoryId, productId, sortBy, sortOrder: sortDir }),
    getAllCategoriesAdmin(),
    productId
      ? db
          .select({ id: products.id, slug: products.slug, name: products.name })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1)
          .then((rs) => rs[0] ?? null)
      : Promise.resolve(null),
  ])

  const initialProductItem = productInitial
    ? {
        id: productInitial.id,
        slug: productInitial.slug,
        name:
          (productInitial.name as Record<string, string>)?.es ??
          (productInitial.name as Record<string, string>)?.pt ??
          productInitial.slug,
      }
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Variantes</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} variante{result.total !== 1 ? "s" : ""}
            {initialProductItem ? (
              <>
                {" "}
                de <span className="font-medium text-foreground">{initialProductItem.name}</span>
              </>
            ) : (
              " en total"
            )}
          </p>
        </div>
        <Button asChild>
          <Link href={productId ? `/dashboard/variants/new?productId=${productId}` : "/dashboard/variants/new"}>
            <Plus className="size-4" />
            Nueva variante
          </Link>
        </Button>
      </div>

      <VariantsTable
        variants={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        perPage={perPage}
        categories={categories}
        initialProductItem={initialProductItem}
      />
    </div>
  )
}
