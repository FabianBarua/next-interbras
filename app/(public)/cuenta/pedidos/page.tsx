import { getOrders } from "@/services/orders"
import { requireAuth } from "@/lib/auth/get-session"
import { isEcommerceEnabled } from "@/lib/settings"
import { redirect } from "next/navigation"
import Link from "@/i18n/link"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"
import { getAllStatusesForDisplay } from "@/lib/order-status-helpers"

export default async function OrdersPage() {
  if (!(await isEcommerceEnabled())) redirect("/")

  const user = await requireAuth()
  const locale = await getLocale()
  const [orders, dict, statuses] = await Promise.all([
    getOrders(user.id),
    getDictionary(),
    getAllStatusesForDisplay(locale),
  ])
  const statusMap = new Map(statuses.map(s => [s.slug, s]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{dict.account.orders}</h1>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="rounded-3xl border border-border/50 bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/5 transition-all">
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">#{order.id.split('-')[1]}</span>
                {(() => {
                  const info = statusMap.get(order.status)
                  if (!info) return null
                  return (
                    <span
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{ backgroundColor: `${info.color}20`, color: info.color }}
                    >
                      {info.label}
                    </span>
                  )
                })()}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} {dict.common.products}
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
                {dict.account.viewDetail}
              </Link>
            </div>

          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-3xl bg-muted/20">
            {dict.account.noOrders}
          </div>
        )}
      </div>
    </div>
  )
}
