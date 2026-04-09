import { requireAdmin } from "@/lib/auth/get-session"
import { getAttributeByIdAdmin } from "@/services/admin/attributes"
import { notFound } from "next/navigation"
import { AttributeEditClient } from "./client"

export default async function AttributeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const attribute = await getAttributeByIdAdmin(id)
  if (!attribute) notFound()
  return <AttributeEditClient attribute={attribute} />
}
