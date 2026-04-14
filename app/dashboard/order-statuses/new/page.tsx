import { requireAdmin } from "@/lib/auth/get-session"
import { OrderStatusForm } from "./client"

export default async function NewOrderStatusPage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo estado de pedido</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo estado de pedido</p>
      </div>
      <OrderStatusForm />
    </div>
  )
}
