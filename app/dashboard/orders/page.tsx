import { requireAdmin } from "@/lib/auth/get-session"
import { getAllOrders } from "@/services/orders"
import type { OrderStatus } from "@/types/order"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PROCESSING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  await requireAdmin()
  const params = await searchParams
  const statusFilter = params.status as OrderStatus | undefined
  const page = Number(params.page) || 1

  const { orders, total } = await getAllOrders({
    status: statusFilter,
    page,
    perPage: 50,
  })
  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{total} pedidos en total</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/dashboard/orders" active={!statusFilter}>Todos</FilterLink>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <FilterLink key={key} href={`/dashboard/orders?status=${key}`} active={statusFilter === key}>
            {label}
          </FilterLink>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Pedido</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Pago</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron pedidos.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{order.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    US$ {fmt(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/orders?${statusFilter ? `status=${statusFilter}&` : ""}page=${p}`}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                p === page ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </Link>
  )
}
