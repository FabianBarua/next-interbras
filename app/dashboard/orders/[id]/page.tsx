import { requireAdmin } from "@/lib/auth/get-session"
import { getOrderByIdAdmin } from "@/services/orders"
import { notFound } from "next/navigation"
import Link from "next/link"
import { OrderStatusForm } from "./status-form"

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const order = await getOrderByIdAdmin(id)
  if (!order) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pedidos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono">{order.id.slice(0, 8)}...</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("es-PY", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {/* Items */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 font-medium text-sm">Productos</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Producto</th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">SKU</th>
                  <th className="text-center px-4 py-2 font-medium text-xs text-muted-foreground">Cant.</th>
                  <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">Precio</th>
                  <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {item.productName?.es || item.productName?.pt || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">US$ {fmt(item.price)}</td>
                    <td className="px-4 py-3 text-right font-medium">US$ {fmt(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>US$ {fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Envío ({order.shippingMethod ?? "—"})
              </span>
              <span>{order.shippingCost === 0 ? "Gratis" : `US$ ${fmt(order.shippingCost)}`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>US$ {fmt(order.totalAmount)}</span>
            </div>
          </div>

          {/* Customer info */}
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-medium text-sm">Cliente</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{order.customerPhone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-medium">{order.customerDocument ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="border rounded-lg p-4 space-y-2">
              <h2 className="font-medium text-sm">Dirección de envío</h2>
              <div className="text-sm text-muted-foreground">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                {order.shippingAddress.zipCode && <p>CP: {order.shippingAddress.zipCode}</p>}
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="border rounded-lg p-4 space-y-2">
              <h2 className="font-medium text-sm">Notas</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar — Status update */}
        <div className="space-y-4">
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentTrackingCode={order.trackingCode ?? ""}
          />

          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <h2 className="font-medium">Info del pedido</h2>
            <div className="space-y-1 text-muted-foreground">
              <p>Método de pago: <span className="capitalize text-foreground">{order.paymentMethod}</span></p>
              <p>Método de envío: <span className="text-foreground">{order.shippingMethod ?? "—"}</span></p>
              {order.trackingCode && (
                <p>Código de rastreo: <span className="font-mono text-foreground">{order.trackingCode}</span></p>
              )}
              <p>Moneda: <span className="text-foreground">{order.currency}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
