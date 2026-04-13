import { requireAdmin } from "@/lib/auth/get-session"
import { getAttributeByIdAdmin } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { BulkValueForm } from "./client"

export default async function BulkValuePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const attribute = await getAttributeByIdAdmin(id)
  if (!attribute) notFound()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Crear valores en lote</h1>
        <p className="text-sm text-muted-foreground">Atributo: {attribute.name.es}</p>
      </div>
      <BulkValueForm attributeId={id} attributeName={attribute.name.es ?? ""} />
    </div>
  )
}
