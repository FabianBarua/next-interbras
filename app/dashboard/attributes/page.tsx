import { requireAdmin } from "@/lib/auth/get-session"
import { searchAttributes } from "@/services/admin/attributes"
import { AttributesTable } from "./table"
import { parsePerPage, perPageToLimit } from "@/lib/pagination"
import Link from "next/link"

export default async function AtributosPage({
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
  const sortBy = str("sortBy") || "sortOrder"
  const sortDir = str("sortDir") || "asc"

  const result = await searchAttributes({ page, limit: perPageToLimit(perPage), search, sortBy, sortOrder: sortDir })

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Atributos</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} atributo{result.total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/attributes/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo atributo
        </Link>
      </div>

      <AttributesTable
        attributes={result.items}
        total={result.total}
        totalPages={result.totalPages}
        perPage={perPage}
      />
    </div>
  )
}
