import Link from "next/link"
import {
  searchAffiliates,
  getAffiliateStatusCounts,
} from "@/lib/actions/admin/affiliates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AffiliatesTable } from "@/components/dashboard/affiliates-table"
import { UserCheck, UserX, Clock, Search } from "lucide-react"
import type React from "react"

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

export default async function AffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const search = sp.search ?? ""
  const status = sp.status ?? ""

  const [result, counts] = await Promise.all([
    searchAffiliates({ page, search, status }),
    getAffiliateStatusCounts(),
  ])

  const qsBase: Record<string, string> = {}
  if (search) qsBase.search = search
  if (status) qsBase.status = status

  const statuses = ["pending", "approved", "rejected"]

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard
          label="Aprobados"
          value={counts.approved ?? 0}
          icon={<UserCheck className="size-4 text-emerald-600" />}
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="Pendientes"
          value={counts.pending ?? 0}
          icon={<Clock className="size-4 text-amber-600" />}
          bg="bg-amber-500/10"
        />
        <StatCard
          label="Rechazados"
          value={counts.rejected ?? 0}
          icon={<UserX className="size-4 text-red-600" />}
          bg="bg-red-500/10"
        />
      </div>

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-50 flex-1">
          <label
            htmlFor="search"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Buscar afiliado
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Nombre, email o código..."
              className="pl-8"
            />
          </div>
        </div>
        <div className="w-52">
          <label
            htmlFor="status"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
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
        {(search || status) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/affiliates">Limpiar</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <AffiliatesTable affiliates={result.affiliates} total={result.total} />

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
                  href={`/dashboard/affiliates?${buildQs(qsBase, { page: String(result.page - 1) })}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates?${buildQs(qsBase, { page: String(result.page + 1) })}`}
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

function StatCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string
  value: number
  icon: React.ReactNode
  bg: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <div
          className={`flex size-8 items-center justify-center rounded-md ${bg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
