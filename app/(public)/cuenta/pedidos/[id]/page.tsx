import { getOrderById } from "@/services/orders"
import { requireAuth } from "@/lib/auth/get-session"
import { notFound } from "next/navigation"
import Link from "@/i18n/link"
import { OrderTracker } from "@/components/store/order-tracker"
import { Separator } from "@/components/ui/separator"

export default async function OrderDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth()
  const resolvedParams = await params
  const { id } = resolvedParams
  const order = await getOrderById(id)

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

  const statusLabels: Record<string, { text: string; color: string }> = {
    PENDING: { text: "Pendiente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    PROCESSING: { text: "En proceso", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    SHIPPED: { text: "En camino", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    DELIVERED: { text: "Entregado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    CANCELLED: { text: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  }

  const st = statusLabels[order.status] || statusLabels.PENDING
  const shippingCost = 8.5

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
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.color}`}>
            {st.text}
          </span>
        </div>
      </div>

      {/* Order meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>Fecha: <strong className="text-foreground">{createdDate}</strong></span>
        <span>Total: <strong className="text-foreground">US$ {fmt(order.totalAmount + shippingCost)}</strong></span>
        <span>{order.items.length} artículo{order.items.length > 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Tracking */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 sm:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">Seguimiento</h2>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Seguí el estado de mi pedido Interbras: ${process.env.NEXT_PUBLIC_SITE_URL || "https://interbras.com.py"}/tracking/${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border hover:bg-muted transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                Compartir tracking
              </a>
            </div>
            <OrderTracker
              status={order.status}
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
              {order.status === "DELIVERED" && (
                <TimelineEntry
                  title="Pedido entregado"
                  desc="El paquete fue recibido en la dirección de destino."
                  date="5 abr., 14:30"
                  active
                />
              )}
              {(order.status === "DELIVERED" || order.status === "SHIPPED") && (
                <TimelineEntry
                  title="Paquete despachado"
                  desc="Se entregó al servicio de courier para envío."
                  date="3 abr., 10:15"
                />
              )}
              {order.status !== "PENDING" && (
                <TimelineEntry
                  title="Preparando embalaje"
                  desc="El equipo de expedición comenzó a preparar tu pedido."
                  date={new Date(order.updatedAt).toLocaleDateString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                />
              )}
              <TimelineEntry
                title="Pago confirmado"
                desc="Tu pago fue verificado correctamente."
                date={new Date(order.createdAt).toLocaleDateString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              />
              <TimelineEntry
                title="Pedido realizado"
                desc="Recibimos tu orden correctamente."
                date={new Date(order.createdAt).toLocaleDateString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              />
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
                <span>US$ {fmt(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>US$ {fmt(shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">US$ {fmt(order.totalAmount + shippingCost)}</span>
              </div>
            </div>
          </div>

          {/* Shipping info */}
          <div className="rounded-3xl border border-border/50 bg-card text-sm p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-3">Envío</h2>
            <div className="space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">Av. San Blas 123</p>
              <p>Ciudad del Este, Alto Paraná</p>
              <p>Paraguay</p>
            </div>
            <Separator className="my-3" />
            <div>
              <p className="text-xs text-muted-foreground">Método</p>
              <p className="font-medium text-foreground mt-0.5">Envío Estándar (5-7 días hábiles)</p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-3xl border border-border/50 bg-card text-sm p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <h2 className="font-bold text-base mb-3">Pago</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-muted border flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Tarjeta terminada en 4242</p>
                <p className="text-xs text-muted-foreground">Crédito</p>
              </div>
            </div>
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
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{date}</p>
      </div>
    </div>
  )
}
