import { getApprovedAffiliates } from "@/lib/actions/admin/affiliates"
import { NewPayoutForm } from "@/components/dashboard/new-payout-form"

export default async function NewPayoutPage() {
  const affiliates = await getApprovedAffiliates()

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Generar nuevo pago</h2>
      <NewPayoutForm approvedAffiliates={affiliates} />
    </div>
  )
}
