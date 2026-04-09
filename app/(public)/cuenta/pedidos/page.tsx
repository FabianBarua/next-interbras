import { getOrders } from "@/services/orders"
import { requireAuth } from "@/lib/auth/get-session"
import Link from "next/link"

export default async function OrdersPage() {
  const user = await requireAuth()
  const orders = await getOrders(user.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mis Pedidos</h1>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="rounded-3xl border border-border/50 bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/5 transition-all">
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">#{order.id.split('-')[1]}</span>
                {order.status === "DELIVERED" && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Entregado</span>}
                {order.status === "PROCESSING" && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">En proceso</span>}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} productos
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
              <div className="md:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="font-bold text-lg">US$ {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              
              <Link 
                href={`/cuenta/pedidos/${order.id}`}
                className="px-4 py-2 border rounded-md font-medium text-sm hover:bg-accent transition-colors"
              >
                Ver Detalle
              </Link>
            </div>

          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-3xl bg-muted/20">
            Aún no tienes pedidos.
          </div>
        )}
      </div>
    </div>
  )
}
