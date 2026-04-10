import Link from "next/link"
import {
  searchCommissions,
  getCommissionStatusCounts,
} from "@/lib/actions/admin/affiliates"
import { Button } from "@/components/ui/button"
import { CommissionsTable } from "@/components/dashboard/commissions-table"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  paid: "Pagada",
}

function buildQs(
  current: Record<string, string>,
  overrides: Record<string, string>,
) {
  const merged = { ...current, ...overrides }
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v)
  }
  return params.toString()
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    affiliateId?: string
  }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const search = sp.search ?? ""
  const status = sp.status ?? ""
  const affiliateId = sp.affiliateId ?? ""

  const [result, counts] = await Promise.all([
    searchCommissions({ page, search, status, affiliateId }),
    getCommissionStatusCounts(),
  ])

  const qsBase: Record<string, string> = {}
  if (search) qsBase.search = search
  if (status) qsBase.status = status
  if (affiliateId) qsBase.affiliateId = affiliateId

  const statuses = ["pending", "approved", "rejected", "paid"]

  return (
    <div>
      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Buscar
          </label>
          <input
            id="search"
            name="search"
            defaultValue={search}
            placeholder="Nombre, email o código del afiliado..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="w-48">
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos ({counts.total ?? 0})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s} ({counts[s] ?? 0})
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" size="sm">
          Filtrar
        </Button>

        {(search || status || affiliateId) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/affiliates/commissions">Limpiar</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <CommissionsTable commissions={result.commissions} />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/commissions?${buildQs(qsBase, { page: String(result.page - 1) })}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/commissions?${buildQs(qsBase, { page: String(result.page + 1) })}`}
                >
                  Siguiente
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
