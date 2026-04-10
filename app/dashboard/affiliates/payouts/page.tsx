import Link from "next/link"
import { searchPayouts } from "@/lib/actions/admin/affiliates"
import { Button } from "@/components/ui/button"
import { PayoutsTable } from "@/components/dashboard/payouts-table"
import { Plus } from "lucide-react"

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

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const status = sp.status ?? ""

  const result = await searchPayouts(page)

  const qsBase: Record<string, string> = {}
  if (status) qsBase.status = status

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-48">
            <select
              name="status"
              defaultValue={status}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <Button asChild size="sm">
          <Link href="/dashboard/affiliates/payouts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo pago
          </Link>
        </Button>
      </div>

      <PayoutsTable payouts={result.payouts} />

      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {result.page} de {result.totalPages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/payouts?${buildQs(qsBase, { page: String(result.page - 1) })}`}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {result.page < result.totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/affiliates/payouts?${buildQs(qsBase, { page: String(result.page + 1) })}`}
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
