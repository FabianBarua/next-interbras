import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/get-session"
import { getOrderFlowById } from "@/services/admin/order-flows"
import { getAllOrderStatuses } from "@/services/admin/order-statuses"
import { getAllShippingMethods } from "@/services/shipping-methods"
import { getAllGatewayTypes } from "@/lib/actions/admin/shipping-payment-rules"
import { OrderFlowEditForm } from "./client"

export default async function EditOrderFlowPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const flow = await getOrderFlowById(id)
  if (!flow) notFound()

  const [allStatuses, shippingMethods, gatewayTypes] = await Promise.all([
    getAllOrderStatuses(),
    getAllShippingMethods(),
    getAllGatewayTypes(),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar flujo de pedido</h1>
        <p className="text-sm text-muted-foreground">{flow.name.es ?? flow.id}</p>
      </div>
      <OrderFlowEditForm
        flow={flow}
        allStatuses={allStatuses}
        shippingMethods={shippingMethods}
        gatewayTypes={gatewayTypes}
      />
    </div>
  )
}
