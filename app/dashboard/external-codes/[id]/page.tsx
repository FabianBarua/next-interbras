import { requireAdmin } from "@/lib/auth/get-session"
import { getExternalCodeByIdAdmin } from "@/services/admin/external-codes"
import { notFound } from "next/navigation"
import { ExternalCodeEditForm } from "./client"

export default async function EditarCodigoExternoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const ec = await getExternalCodeByIdAdmin(id)
  if (!ec) notFound()
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Editar código externo</h1>
      <ExternalCodeEditForm ec={ec} />
    </div>
  )
}
