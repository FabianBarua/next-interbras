import { notFound } from "next/navigation"
import Link from "next/link"
import { getOrderDetail, getOrderPaymentDetails, getValidStatusesForOrder } from "@/lib/actions/orders"
import { PayerDetails } from "@/components/dashboard/payer-details"
import { getStatusLabel, getStatusColor } from "@/lib/order-status-helpers"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { OrderHeader } from "./order-header"
import { OrderItemsTable } from "./order-items-table"
import { OrderTotals } from "./order-totals"
import { OrderCustomer } from "./order-customer"
import { OrderShipping } from "./order-shipping"
import { OrderInfo } from "./order-info"
import { OrderPaymentDetails } from "./order-payment-details"
import { OrderStatusForm } from "./status-form"
import { OrderActions } from "./order-actions"
import { OrderNotes } from "./order-notes"

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [data, payerDetails, validStatuses] = await Promise.all([
    getOrderDetail(id),
    getOrderPaymentDetails(id),
    getValidStatusesForOrder(id),
  ])

  if (!data) notFound()

  const { order, items, payment, notes, user } = data

  const [statusLabel, statusColor] = await Promise.all([
    getStatusLabel(order.status, "es"),
    getStatusColor(order.status),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/orders" className="hover:text-foreground transition-colors">
          Pedidos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{order.id.slice(0, 8)}</span>
      </nav>

      {/* Header */}
      <OrderHeader
        orderId={order.id}
        statusLabel={statusLabel}
        statusColor={statusColor}
        createdAt={order.createdAt}
        total={order.total}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Products + Totals card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Productos
                <Badge variant="secondary" className="text-xs font-normal">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <OrderItemsTable items={items} />
            </CardContent>
            <Separator />
            <CardFooter className="flex-col items-stretch pt-4">
              <OrderTotals
                subtotal={order.subtotal}
                discount={order.discount}
                shippingCost={order.shippingCost}
                shippingMethod={order.shippingMethod}
                total={order.total}
              />
            </CardFooter>
          </Card>

          {/* Payment card */}
          <Card>
            <CardHeader>
              <CardTitle>Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <OrderPaymentDetails
                payment={payment ?? null}
                paymentMethod={order.paymentMethod}
              />
              {payerDetails && (
                <>
                  <Separator className="my-4" />
                  <PayerDetails details={payerDetails} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer & Shipping card */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente y envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <OrderCustomer user={user ?? null} order={order} />
              <Separator className="my-4" />
              <OrderShipping
                address={order.shippingAddress as {
                  street?: string; city?: string; state?: string;
                  zipCode?: string; country?: string
                } | null}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6 order-first lg:order-none lg:sticky lg:top-6 h-fit">
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            currentTrackingCode={order.trackingCode ?? ""}
            statuses={validStatuses}
          />

          <OrderActions
            orderId={order.id}
            orderStatus={order.status}
            paymentStatus={payment?.status ?? null}
            paymentMethod={order.paymentMethod}
          />

          <OrderInfo
            paymentMethod={order.paymentMethod}
            shippingMethod={order.shippingMethod}
            trackingCode={order.trackingCode}
            sourceDomain={order.sourceDomain}
            currency={order.currency}
          />

          <OrderNotes orderId={order.id} notes={notes} />
        </div>
      </div>
    </div>
  )
}
