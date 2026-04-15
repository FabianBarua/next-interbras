import { redirect, notFound } from "next/navigation"
import { resolveExternalCodeUrl } from "@/services/products"

export default async function ExternalCodeRedirectPage(
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const url = await resolveExternalCodeUrl(code)
  if (!url) notFound()
  redirect(url)
}
