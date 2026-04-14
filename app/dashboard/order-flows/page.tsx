import { requireAdmin } from "@/lib/auth/get-session"
import { getAllOrderFlows } from "@/services/admin/order-flows"
import { OrderFlowsTable } from "./table"
import Link from "next/link"

export default async function AdminOrderFlowsPage() {
  await requireAdmin()
  const flows = await getAllOrderFlows()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Flujos de Pedido</h1>
          <p className="text-sm text-muted-foreground">
            {flows.length} flujo{flows.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/order-flows/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo flujo
        </Link>
      </div>

      <OrderFlowsTable items={flows} />
    </div>
  )
}
