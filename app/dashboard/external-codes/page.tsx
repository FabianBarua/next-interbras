import { requireAdmin } from "@/lib/auth/get-session"
import { getAllExternalCodesAdmin } from "@/services/admin/external-codes"
import { ExternalCodesClient } from "./client"

export default async function ExternoPage({ searchParams }: { searchParams: Promise<{ search?: string; system?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const codes = await getAllExternalCodesAdmin({ search: sp.search, system: sp.system })
  return <ExternalCodesClient initialCodes={codes} search={sp.search ?? ""} system={sp.system ?? ""} />
}
