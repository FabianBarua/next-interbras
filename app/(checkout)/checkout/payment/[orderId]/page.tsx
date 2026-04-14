import { notFound, redirect } from "next/navigation"
import { eq, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { orders, payments, gatewayConfig } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { getActiveGatewaysForDomain } from "@/lib/actions/admin/gateway-config"
import { PaymentBlockRenderer } from "./payment-block-renderer"
import { GatewaySelector } from "./gateway-selector"
import { AutoPaymentCreator } from "./auto-payment-creator"
import "@/lib/payments/init"

// Maps order.paymentMethod → gateway type for manual gateways
const MANUAL_GATEWAY_TYPE: Record<string, string> = {
  cash: "manual-cash",
  transfer: "manual-transfer",
  card: "manual-card",
}

const fmt = (n: number) =>
  `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const session = await auth()

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, userId: true, status: true, total: true, paymentMethod: true },
  })

  if (!order) notFound()
  if (!session?.user?.id) notFound()
  if (order.userId !== session.user.id) notFound()

  // If already confirmed/shipped/delivered, redirect to confirmation
  if (["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status)) {
    redirect(`/checkout/confirmacion?orderId=${orderId}`)
  }

  // If cancelled, show error
  if (order.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <h1 className="mb-4 text-xl font-bold">Pedido cancelado</h1>
        <p className="text-muted-foreground">
          Este pedido fue cancelado. Intente realizar un nuevo pedido.
        </p>
      </div>
    )
  }

  // Check if payment record already exists (latest first)
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
    orderBy: desc(payments.createdAt),
    columns: { id: true, gateway: true, metadata: true, status: true },
  })

  // Payment exists and pending — check if PIX expired server-side
  if (payment && payment.status === "pending") {
    const meta = payment.metadata as Record<string, unknown> | null
    const expiresAt = meta?.expiresAt as string | null

    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      // Expired — reset so user can retry
      await db.update(payments).set({ status: "failed" }).where(eq(payments.id, payment.id))
      await db.update(orders).set({ status: "PENDING" }).where(eq(orders.id, orderId))
    } else {
      // Payment still valid — look up gateway type and show block
      const gwConfig = await db.query.gatewayConfig.findFirst({
        where: eq(gatewayConfig.slug, payment.gateway),
        columns: { type: true },
      })
      return (
        <div className="mx-auto max-w-lg px-4 py-8">
          <h1 className="mb-6 text-center text-xl font-bold">Pago</h1>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{fmt(Number(order.total))}</span>
          </p>
          <PaymentBlockRenderer
            gatewayType={gwConfig?.type ?? payment.gateway}
            data={meta ?? {}}
            orderId={orderId}
          />
        </div>
      )
    }
  }

  // Order stuck in PROCESSING with no valid payment — reset to PENDING
  if (order.status === "PROCESSING") {
    await db.update(orders).set({ status: "PENDING" }).where(eq(orders.id, orderId))
  }

  // Resolve active gateways for this domain (used by both manual and PIX paths)
  const hdrs = await headers()
  const domain = (hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "").split(":")[0]
  const activeGateways = await getActiveGatewaysForDomain(domain)

  // ── Manual payment (cash / transfer / card) ──────────────────────────────────
  const manualType = MANUAL_GATEWAY_TYPE[order.paymentMethod]
  if (manualType) {
    const manualGw = activeGateways.find((gw) => gw.type === manualType)
    if (!manualGw) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="mb-4 text-xl font-bold">Pago</h1>
          <p className="text-muted-foreground">
            El método de pago seleccionado no está disponible. Contacte con soporte.
          </p>
        </div>
      )
    }
    // Auto-create the payment record (no user input needed for manual methods)
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-2 text-center text-xl font-bold">Pago</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{fmt(Number(order.total))}</span>
        </p>
        <AutoPaymentCreator orderId={orderId} gatewaySlug={manualGw.slug} />
      </div>
    )
  }

  // ── PIX / external gateway — show selector ───────────────────────────────────
  const pixGateways = activeGateways.filter((gw) => gw.type.includes("pix"))
  const selectable = pixGateways.length > 0
    ? pixGateways
    : activeGateways // fallback: show all if no PIX-specific match

  if (selectable.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center">
        <h1 className="mb-4 text-xl font-bold">Pago</h1>
        <p className="text-muted-foreground">
          No hay métodos de pago disponibles en este momento. Intente más tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-center text-xl font-bold">Elija el método de pago</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{fmt(Number(order.total))}</span>
      </p>
      <GatewaySelector
        orderId={orderId}
        gateways={selectable.map((g) => ({ name: g.slug, displayName: g.displayName, type: g.type }))}
      />
    </div>
  )
}
