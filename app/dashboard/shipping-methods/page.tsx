import { requireAdmin } from "@/lib/auth/get-session"
import { getAllShippingMethods } from "@/services/shipping-methods"
import { ShippingMethodsTable } from "./table"
import Link from "next/link"

export default async function AdminShippingMethodsPage() {
  await requireAdmin()
  const shippingMethods = await getAllShippingMethods()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Métodos de Envío</h1>
          <p className="text-sm text-muted-foreground">
            {shippingMethods.length} método{shippingMethods.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/shipping-methods/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo método de envío
        </Link>
      </div>

      <ShippingMethodsTable items={shippingMethods} />
    </div>
  )
}
