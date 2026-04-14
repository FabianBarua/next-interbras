import { requireAdmin } from "@/lib/auth/get-session"
import { ShippingMethodForm } from "./client"

export default async function NewShippingMethodPage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo método de envío</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo método de envío</p>
      </div>
      <ShippingMethodForm />
    </div>
  )
}
