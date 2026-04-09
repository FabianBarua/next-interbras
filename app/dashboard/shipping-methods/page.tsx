import { requireAdmin } from "@/lib/auth/get-session"
import { getAllShippingMethods } from "@/services/shipping-methods"
import { ShippingMethodsTable } from "./table"

export default async function AdminShippingMethodsPage() {
  await requireAdmin()
  const shippingMethods = await getAllShippingMethods()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Métodos de Envío</h1>
          <p className="text-sm text-muted-foreground">Configurá los métodos de envío disponibles en el checkout.</p>
        </div>
      </div>

      <ShippingMethodsTable items={shippingMethods} />
    </div>
  )
}
