import { requireAdmin } from "@/lib/auth/get-session"
import { searchExternalCodes, getDistinctSystems } from "@/services/admin/external-codes"
import { ExternalCodesTable } from "./table"
import Link from "next/link"

export default async function ExternoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const sp = await searchParams
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] : "") ?? ""

  const page = Math.max(1, Number(str("page")) || 1)
  const search = str("search") || undefined
  const system = str("system") || undefined

  const [result, systems] = await Promise.all([
    searchExternalCodes({ page, limit: 50, search, system }),
    getDistinctSystems(),
  ])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Códigos externos</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} código{result.total !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/external-codes/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo código
        </Link>
      </div>

      <ExternalCodesTable
        codes={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        systems={systems}
      />
    </div>
  )
}
