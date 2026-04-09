import { requireAdmin } from "@/lib/auth/get-session"
import { getAllAttributesAdmin } from "@/services/admin/attributes"
import { AttributesClient } from "./client"

export default async function AtributosPage() {
  await requireAdmin()
  const attributes = await getAllAttributesAdmin()
  return <AttributesClient initialAttributes={attributes} />
}
