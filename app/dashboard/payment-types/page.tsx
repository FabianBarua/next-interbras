import { requireAdmin } from "@/lib/auth/get-session"
import { getAllPaymentTypes } from "@/services/payment-types"
import { PaymentTypesTable } from "./table"

export default async function AdminPaymentTypesPage() {
  await requireAdmin()
  const paymentTypes = await getAllPaymentTypes()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Tipos de Pago</h1>
          <p className="text-sm text-muted-foreground">Configurá los métodos de pago disponibles en el checkout.</p>
        </div>
      </div>

      <PaymentTypesTable items={paymentTypes} />
    </div>
  )
}
