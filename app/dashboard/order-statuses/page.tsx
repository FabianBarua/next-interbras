import { requireAdmin } from "@/lib/auth/get-session"
import { getAllOrderStatuses } from "@/services/admin/order-statuses"
import { OrderStatusesTable } from "./table"
import Link from "next/link"

export default async function AdminOrderStatusesPage() {
  await requireAdmin()
  const statuses = await getAllOrderStatuses()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Estados de Pedido</h1>
          <p className="text-sm text-muted-foreground">
            {statuses.length} estado{statuses.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/order-statuses/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo estado
        </Link>
      </div>

      <OrderStatusesTable items={statuses} />
    </div>
  )
}
