import { getOrderDetailById } from "@/services/orders"
import { requireAuth } from "@/lib/auth/get-session"
import { isEcommerceEnabled } from "@/lib/settings"
import { notFound, redirect } from "next/navigation"
import Link from "@/i18n/link"
import { OrderTracker } from "@/components/store/order-tracker"
import { Separator } from "@/components/ui/separator"
import { getFlowForOrder } from "@/lib/order-flow-resolver"
import { getAllStatusesForDisplay, getStatusLabel, getStatusColor } from "@/lib/order-status-helpers"
import { getLocale } from "@/i18n/get-dictionary"
import { getRequestUrl } from "@/lib/get-base-url"

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  pix: "PIX",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  succeeded: "Pagado",
  failed: "Fallido",
  refunded: "Reembolsado",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  succeeded: "#22c55e",
  failed: "#ef4444",
  refunded: "#8b5cf6",
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ),
  card: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
  ),
  transfer: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M4 19h16" /><path d="M4 15h16" /><path d="M4 11h16" /><path d="M4 7h4" /><path d="M12 7h8" /></svg>
  ),
  pix: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
}

export default async function OrderDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isEcommerceEnabled())) redirect("/")

  const user = await requireAuth()
  const resolvedParams = await params
  const { id } = resolvedParams
  const order = await getOrderDetailById(id)

  if (!order || order.userId !== user.id) {
    notFound()
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const createdDate = new Date(order.createdAt).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const updatedDate = new Date(order.updatedAt).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

  const locale = await getLocale()
  const [statusLabel, statusColor, flow, allStatuses, baseUrl] = await Promise.all([
    getStatusLabel(order.status, locale),
    getStatusColor(order.status),
    getFlowForOrder(id),
    getAllStatusesForDisplay(locale),
    getRequestUrl(),
  ])
  const statusMap = new Map(allStatuses.map(s => [s.slug, s]))
  const trackerSteps = (flow?.steps ?? []).map(step => {
    const info = statusMap.get(step.statusSlug)
    return { slug: step.statusSlug, label: info?.label ?? step.statusSlug, icon: info?.icon ?? "Circle" }
  })

  // Build timeline from flow steps up to current status
  const flowSteps = flow?.steps ?? []
  const currentStepIndex = flowSteps.findIndex(s => s.statusSlug === order.status)
  const completedSteps = currentStepIndex >= 0 ? flowSteps.slice(0, currentStepIndex + 1) : []

  const addr = order.shippingAddress
  const total = order.subtotal + order.shippingCost

  // Payment info
  const paymentInfo = order.paymentInfo
  const needsPayment =
    order.status === "pending" &&
    (!paymentInfo || paymentInfo.status === "pending" || paymentInfo.status === "failed")
  const paymentFailed = paymentInfo?.status === "failed"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Link
          href="/cuenta/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Mis Pedidos
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id}</h1>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Order meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>Fecha: <strong className="text-foreground">{createdDate}</strong></span>
        <span>Total: <strong className="text-foreground">US$ {fmt(total)}</strong></span>
        <span>{order.items.length} artículo{order.items.length > 1 ? "s" : ""}</span>
        {order.trackingCode && (
          <span>Tracking: <strong className="text-foreground font-mono">{order.trackingCode}</strong></span>
        )}
      </div>

      {/* Payment action banner */}
      {needsPayment && (
        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
          paymentFailed
            ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20"
        }`}>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${paymentFailed ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
              {paymentFailed ? "El pago no pudo ser procesado" : "Pago pendiente"}
            </p>
            <p className={`text-xs mt-1 ${paymentFailed ? "text-red-700/80 dark:text-red-300/80" : "text-amber-700/80 dark:text-amber-300/80"}`}>
              {paymentFailed
                ? "Hubo un problema con su pago. Puede intentar nuevamente con otro método."
                : "Complete el pago para que su pedido sea procesado."}
            </p>
          </div>
          <a
            href={`/checkout/payment/${order.id}`}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors shrink-0 ${
              paymentFailed
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
            {paymentFailed ? "Reintentar pago" : "Completar pago"}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Tracking */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">Seguimiento</h2>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Seguí el estado de mi pedido Interbras: ${baseUrl}/tracking/${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                Compartir tracking
              </a>
            </div>
            <OrderTracker
              steps={trackerSteps}
              currentStatus={order.status}
              dateStr={updatedDate}
            />
          </div>

          {/* Items */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-4">Artículos del Pedido</h2>
            <div className="space-y-0">
              {order.items.map((item, idx) => {
                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 py-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-muted/30 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">{item.productName.es?.slice(0, 3)?.toUpperCase() ?? "IMG"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {item.productName.es}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cant: {item.quantity} × US$ {fmt(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-bold shrink-0">
                        US$ {fmt(item.price * item.quantity)}
                      </span>
                    </div>
                    {idx < order.items.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Timeline / Activity log */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-4">Historial de Actividad</h2>
            <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {completedSteps.length > 0 ? (
                [...completedSteps].reverse().map((step, idx) => {
                  const info = statusMap.get(step.statusSlug)
                  const isLatest = idx === 0
                  return (
                    <TimelineEntry
                      key={step.statusSlug}
                      title={info?.label ?? step.statusSlug}
                      desc=""
                      date={isLatest ? updatedDate : createdDate}
                      active={isLatest}
                    />
                  )
                })
              ) : (
                <TimelineEntry
                  title={statusLabel}
                  desc=""
                  date={createdDate}
                  active
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5 lg:sticky lg:top-24 h-fit">
          {/* Summary */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-4">Resumen</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>US$ {fmt(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{order.shippingCost > 0 ? `US$ ${fmt(order.shippingCost)}` : "Gratis"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">US$ {fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping info */}
          <div className="rounded-3xl border border-border/50 bg-card text-sm p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-3">Envío</h2>
            {addr ? (
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground">{addr.street}</p>
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ""}</p>
                {addr.zipCode && <p>CP: {addr.zipCode}</p>}
                <p>{addr.country}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Sin dirección registrada</p>
            )}
            {order.shippingMethod && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-xs text-muted-foreground">Método</p>
                  <p className="font-medium text-foreground mt-0.5">{order.shippingMethod}</p>
                </div>
              </>
            )}
          </div>

          {/* Payment — enhanced */}
          <div className="rounded-3xl border border-border/50 bg-card text-sm p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">Pago</h2>
              {paymentInfo && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${PAYMENT_STATUS_COLORS[paymentInfo.status] ?? "#6b7280"}20`,
                    color: PAYMENT_STATUS_COLORS[paymentInfo.status] ?? "#6b7280",
                  }}
                >
                  {PAYMENT_STATUS_LABELS[paymentInfo.status] ?? paymentInfo.status}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-muted border flex items-center justify-center">
                {PAYMENT_ICONS[order.paymentMethod] ?? PAYMENT_ICONS.cash}
              </div>
              <div>
                <p className="font-medium text-foreground">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                {paymentInfo?.gateway && (
                  <p className="text-xs text-muted-foreground capitalize">{paymentInfo.gateway}</p>
                )}
              </div>
            </div>

            {/* Payment details */}
            {paymentInfo && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                {paymentInfo.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de pago</span>
                    <span className="font-medium text-foreground">
                      {new Date(paymentInfo.paidAt).toLocaleDateString("es-PY", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {paymentInfo.hasReceipt && paymentInfo.status !== "succeeded" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5" /></svg>
                    <span>Comprobante enviado — en verificación</span>
                  </div>
                )}
                {paymentInfo.hasReceipt && paymentInfo.status === "succeeded" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6 9 17l-5-5" /></svg>
                    <span>Comprobante verificado</span>
                  </div>
                )}
              </div>
            )}

            {/* Retry payment button inline */}
            {needsPayment && (
              <div className="mt-4">
                <a
                  href={`/checkout/payment/${order.id}`}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                  {paymentFailed ? "Reintentar pago" : "Completar pago"}
                </a>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="rounded-3xl border border-border/50 bg-card text-sm p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-3">¿Necesitas ayuda?</h2>
            <div className="space-y-2">
              <a
                href={`https://wa.me/595981123456?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido ${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>
                <span className="font-medium">Contactar por WhatsApp</span>
              </a>
              <Link
                href="/downloads"
                className="flex items-center gap-2.5 p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span className="font-medium">Manuales y Descargas</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineEntry({ title, desc, date, active }: { title: string; desc: string; date: string; active?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
        active ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"
      }`} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        <p className="text-[11px] text-muted-foreground/70 mt-1">{date}</p>
      </div>
    </div>
  )
}
