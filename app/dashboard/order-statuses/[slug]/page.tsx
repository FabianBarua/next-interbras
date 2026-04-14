import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/get-session"
import { getOrderStatusBySlug } from "@/services/admin/order-statuses"
import { OrderStatusEditForm } from "./client"

export default async function EditOrderStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin()
  const { slug } = await params
  const status = await getOrderStatusBySlug(slug)
  if (!status) notFound()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar estado de pedido</h1>
        <p className="text-sm text-muted-foreground">{status.name.es ?? status.slug}</p>
      </div>
      <OrderStatusEditForm status={status} />
    </div>
  )
}
