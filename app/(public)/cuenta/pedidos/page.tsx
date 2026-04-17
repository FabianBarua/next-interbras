import { getOrders } from "@/services/orders"
import { requireAuth } from "@/lib/auth/get-session"
import { isEcommerceEnabled } from "@/lib/settings"
import { redirect } from "next/navigation"
import Link from "@/i18n/link"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"
import { getAllStatusesForDisplay } from "@/lib/order-status-helpers"
import { PAYMENT_STATUS_LABELS_CLIENT, PAYMENT_STATUS_COLORS } from "@/lib/order-constants"

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
        {orders.map(order => {
          const paymentInfo = order.paymentInfo
          const needsPayment =
            order.status === "pending" &&
            (!paymentInfo || paymentInfo.status === "pending" || paymentInfo.status === "failed")
          const paymentFailed = paymentInfo?.status === "failed"

          return (
            <div key={order.id} className="rounded-3xl border border-border/50 bg-card p-6 md:p-8 flex flex-col gap-5 shadow-sm hover:shadow-md ring-1 ring-black/5 dark:ring-white/5 transition-all">

              {/* Row 1: Order info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {/* Payment status badge */}
                    {paymentInfo && paymentInfo.status !== "succeeded" && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{
                          backgroundColor: `${PAYMENT_STATUS_COLORS[paymentInfo.status] ?? "#6b7280"}15`,
                          color: PAYMENT_STATUS_COLORS[paymentInfo.status] ?? "#6b7280",
                        }}
                      >
                        {PAYMENT_STATUS_LABELS_CLIENT[paymentInfo.status] ?? paymentInfo.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} {dict.common.products}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                  <div className="md:text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="font-bold text-lg">US$ {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {needsPayment && (
                      <a
                        href={`/checkout/payment/${order.id}`}
                        className={`px-4 py-2 rounded-md font-bold text-sm text-white transition-colors ${
                          paymentFailed
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {paymentFailed ? "Reintentar" : "Pagar"}
                      </a>
                    )}
                    <Link
                      href={`/cuenta/pedidos/${order.id}`}
                      className="px-4 py-2 border rounded-md font-medium text-sm hover:bg-accent transition-colors"
                    >
                      {dict.account.viewDetail}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Payment action banner for pending orders */}
              {needsPayment && (
                <div className={`rounded-xl px-4 py-3 flex items-center gap-3 text-sm ${
                  paymentFailed
                    ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40"
                    : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={paymentFailed ? "text-red-600" : "text-amber-600"}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                  <span className={paymentFailed ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}>
                    {paymentFailed
                      ? "El pago no pudo ser procesado. Intente nuevamente."
                      : "Complete el pago para que su pedido sea procesado."}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {orders.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-3xl bg-muted/20">
            {dict.account.noOrders}
          </div>
        )}
      </div>
    </div>
  )
}
