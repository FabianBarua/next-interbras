import { requireAdmin } from "@/lib/auth/get-session"
import { getAllShippingMethods } from "@/services/shipping-methods"
import { getAllGatewayTypes } from "@/lib/actions/admin/shipping-payment-rules"
import { OrderFlowForm } from "./client"

export default async function NewOrderFlowPage() {
  await requireAdmin()
  const [shippingMethods, gatewayTypes] = await Promise.all([
    getAllShippingMethods(),
    getAllGatewayTypes(),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo flujo de pedido</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo flujo de pedido</p>
      </div>
      <OrderFlowForm
        shippingMethods={shippingMethods}
        gatewayTypes={gatewayTypes}
      />
    </div>
  )
}
