import { requireAdmin } from "@/lib/auth/get-session"
import { getAttributeByIdAdmin } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { ValueEditForm } from "./client"

export default async function EditValuePage({
  params,
}: {
  params: Promise<{ id: string; vid: string }>
}) {
  await requireAdmin()
  const { id, vid } = await params
  const attribute = await getAttributeByIdAdmin(id)
  if (!attribute) notFound()

  const value = attribute.values.find((v) => v.id === vid)
  if (!value) notFound()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar valor</h1>
        <p className="text-sm text-muted-foreground">Atributo: {attribute.name.es} → {value.name.es}</p>
      </div>
      <ValueEditForm attributeId={id} attributeName={attribute.name.es ?? ""} value={value} />
    </div>
  )
}
