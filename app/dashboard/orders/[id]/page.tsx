import { notFound } from "next/navigation"
import Link from "next/link"
import { getOrderDetail, getOrderPaymentDetails } from "@/lib/actions/orders"
import { PayerDetails } from "@/components/dashboard/payer-details"
import { OrderActions } from "./order-actions"
import { OrderNotes } from "./order-notes"
import { Separator } from "@/components/ui/separator"

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700",
  CONFIRMED:
    "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700",
  PROCESSING:
    "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700",
  SHIPPED:
    "bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700",
  DELIVERED:
    "bg-green-500/10 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700",
  CANCELLED:
    "bg-gray-500/10 text-gray-600 border-gray-300 dark:text-gray-400 dark:border-gray-600",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  succeeded: "Aprobado",
  failed: "Fallido",
  refunded: "Reembolsado",
}

const fmt = (v: string | number) =>
  Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [data, payerDetails] = await Promise.all([
    getOrderDetail(id),
    getOrderPaymentDetails(id),
  ])

  if (!data) notFound()

  const { order, items, payment, notes, user } = data
  const productName = (name: unknown) => {
    if (!name || typeof name !== "object") return "—"
    const n = name as Record<string, string>
    return n.es || n.pt || n.en || "—"
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pedidos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono">{order.id.slice(0, 8)}…</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Main column ── */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                Pedido #{order.id.slice(0, 8)}
              </h1>
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
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {/* Items table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 font-medium text-sm">
              Productos
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">
                    SKU
                  </th>
                  <th className="text-center px-4 py-2 font-medium text-xs text-muted-foreground">
                    Cant.
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">
                    Precio
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-xs text-muted-foreground">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {productName(item.productName)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {item.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      US$ {fmt(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      US$ {fmt(Number(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>
                US${" "}
                {fmt(
                  items.reduce(
                    (sum, i) => sum + Number(i.unitPrice) * i.quantity,
                    0,
                  ),
                )}
              </span>
            </div>
            {order.discount && Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span className="text-green-600">
                  -US$ {fmt(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Envío ({order.shippingMethod ?? "—"})
              </span>
              <span>
                {!order.shippingCost || Number(order.shippingCost) === 0
                  ? "Gratis"
                  : `US$ ${fmt(order.shippingCost)}`}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>US$ {fmt(order.total)}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-medium text-sm">Cliente</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">
                  {user?.name ?? order.customerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">
                  {user?.email ?? order.customerEmail}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">
                  {user?.phone ?? order.customerPhone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="font-medium">
                  {user?.documentNumber ?? order.customerDocument ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="border rounded-lg p-4 space-y-2">
              <h2 className="font-medium text-sm">Dirección de envío</h2>
              <div className="text-sm text-muted-foreground">
                <p>
                  {(order.shippingAddress as Record<string, string>).street}
                </p>
                <p>
                  {(order.shippingAddress as Record<string, string>).city},{" "}
                  {(order.shippingAddress as Record<string, string>).state}
                </p>
                {(order.shippingAddress as Record<string, string>).zipCode && (
                  <p>
                    CP:{" "}
                    {(order.shippingAddress as Record<string, string>).zipCode}
                  </p>
                )}
                <p>
                  {(order.shippingAddress as Record<string, string>).country}
                </p>
              </div>
            </div>
          )}

          {/* Payer details */}
          {payerDetails && <PayerDetails details={payerDetails} />}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Payment info */}
          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <h2 className="font-medium">Info del pedido</h2>
            <div className="space-y-1 text-muted-foreground">
              <p>
                Método de pago:{" "}
                <span className="capitalize text-foreground">
                  {order.paymentMethod ?? "—"}
                </span>
              </p>
              <p>
                Método de envío:{" "}
                <span className="text-foreground">
                  {order.shippingMethod ?? "—"}
                </span>
              </p>
              {order.trackingCode && (
                <p>
                  Código de rastreo:{" "}
                  <span className="font-mono text-foreground">
                    {order.trackingCode}
                  </span>
                </p>
              )}
              {order.sourceDomain && (
                <p>
                  Dominio:{" "}
                  <span className="font-mono text-xs text-foreground">
                    {order.sourceDomain}
                  </span>
                </p>
              )}
              <p>
                Moneda:{" "}
                <span className="text-foreground">
                  {order.currency ?? "USD"}
                </span>
              </p>
            </div>
          </div>

          {/* Payment status */}
          {payment && (
            <div className="border rounded-lg p-4 space-y-2 text-sm">
              <h2 className="font-medium">Pago</h2>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  Estado:{" "}
                  <span className="text-foreground">
                    {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                  </span>
                </p>
                <p>
                  Gateway:{" "}
                  <span className="capitalize text-foreground">
                    {payment.gateway ?? "—"}
                  </span>
                </p>
                {payment.externalId && (
                  <p>
                    ID externo:{" "}
                    <span className="font-mono text-xs text-foreground break-all">
                      {payment.externalId}
                    </span>
                  </p>
                )}
                <p>
                  Monto:{" "}
                  <span className="text-foreground font-medium">
                    US$ {fmt(payment.amount)}
                  </span>
                </p>
                {payment.paidAt && (
                  <p>
                    Pagado:{" "}
                    <span className="text-foreground">
                      {new Date(payment.paidAt).toLocaleDateString("es-PY", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          <OrderActions orderId={order.id} orderStatus={order.status} />

          <Separator />

          <OrderNotes orderId={order.id} notes={notes} />
        </div>
      </div>
    </div>
  )
}
