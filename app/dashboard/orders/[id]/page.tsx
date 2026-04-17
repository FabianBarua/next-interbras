import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getOrderDetail, getOrderPaymentDetails } from "@/lib/actions/orders"
import { PayerDetails } from "@/components/dashboard/payer-details"
import { getStatusLabel, getStatusColor, getAllStatusesForDisplay } from "@/lib/order-status-helpers"
import { OrderActions } from "./order-actions"
import { OrderNotes } from "./order-notes"
import { OrderStatusForm } from "./status-form"
import { Separator } from "@/components/ui/separator"

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  succeeded: "Aprobado",
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia bancaria",
  pix: "PIX",
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

  const [data, payerDetails, allStatuses] = await Promise.all([
    getOrderDetail(id),
    getOrderPaymentDetails(id),
    getAllStatusesForDisplay("es"),
  ])

  if (!data) notFound()

  const { order, items, payment, notes, user } = data
  const productName = (name: unknown) => {
    if (!name || typeof name !== "object") return "—"
    const n = name as Record<string, string>
    return n.es || n.pt || n.en || "—"
  }

  const [statusLabel, statusColor] = await Promise.all([
    getStatusLabel(order.status, "es"),
    getStatusColor(order.status),
  ])

  const meta = (payment?.metadata ?? null) as Record<string, unknown> | null
  const receiptUrl = meta?.receiptUrl as string | undefined

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
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
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                borderColor: `${statusColor}40`,
              }}
            >
              {statusLabel}
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

          {/* Payer details (PIX webhook data) */}
          {payerDetails && <PayerDetails details={payerDetails} />}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Status update form */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentTrackingCode={order.trackingCode ?? ""}
            statuses={allStatuses.map((s) => ({
              slug: s.slug,
              label: s.label,
              color: s.color,
            }))}
          />

          {/* Order info */}
          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <h2 className="font-medium">Info del pedido</h2>
            <div className="space-y-1 text-muted-foreground">
              <p>
                Método de pago:{" "}
                <span className="text-foreground font-medium">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod ?? "—"}
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
            <div className="border rounded-lg p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Pago</h2>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${PAYMENT_STATUS_COLORS[payment.status] ?? "#6b7280"}20`,
                    color: PAYMENT_STATUS_COLORS[payment.status] ?? "#6b7280",
                  }}
                >
                  {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                </span>
              </div>
              <div className="space-y-1 text-muted-foreground">
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

              {/* Transfer bank details from metadata */}
              {order.paymentMethod === "transfer" && !!meta && (
                <div className="border-t pt-3 mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Datos bancarios (transferencia)</p>
                  {!!meta.bankName && (
                    <p>Banco: <span className="text-foreground font-medium">{String(meta.bankName)}</span></p>
                  )}
                  {!!meta.accountType && (
                    <p>Tipo: <span className="text-foreground">{String(meta.accountType)}</span></p>
                  )}
                  {!!meta.holder && (
                    <p>Titular: <span className="text-foreground font-medium">{String(meta.holder)}</span></p>
                  )}
                  {!!meta.accountNumber && (
                    <p>Cuenta: <span className="text-foreground font-mono">{String(meta.accountNumber)}</span></p>
                  )}
                </div>
              )}

              {/* PIX data from metadata */}
              {order.paymentMethod === "pix" && !!meta && (
                <div className="border-t pt-3 mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Datos PIX</p>
                  {!!meta.pixCode && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Código PIX (copia e cola):</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded break-all text-foreground">
                        {String(meta.pixCode).slice(0, 120)}…
                      </p>
                    </div>
                  )}
                  {!!meta.expiresAt && (
                    <p>Expiración: <span className="text-foreground">{new Date(String(meta.expiresAt)).toLocaleString("es-PY")}</span></p>
                  )}
                </div>
              )}

              {/* Card data from metadata */}
              {order.paymentMethod === "card" && !!meta && !!meta.checkoutUrl && (
                <div className="border-t pt-3 mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Datos de tarjeta</p>
                  <p>
                    URL checkout:{" "}
                    <a href={String(meta.checkoutUrl)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs break-all">
                      {String(meta.checkoutUrl).slice(0, 60)}…
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Receipt image (transfer) */}
          {receiptUrl && (
            <div className="border rounded-lg p-4 space-y-3">
              <h2 className="font-medium text-sm">Comprobante de pago</h2>
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Image
                  src={receiptUrl}
                  alt="Comprobante de pago"
                  width={320}
                  height={400}
                  className="rounded-lg border w-full object-contain max-h-[400px]"
                  unoptimized
                />
              </a>
              <p className="text-xs text-muted-foreground">Haga clic para ver en tamaño completo</p>
            </div>
          )}

          <Separator />

          <OrderActions
            orderId={order.id}
            orderStatus={order.status}
            paymentStatus={payment?.status ?? null}
            paymentMethod={order.paymentMethod}
          />

          <Separator />

          <OrderNotes orderId={order.id} notes={notes} />
        </div>
      </div>
    </div>
  )
}
