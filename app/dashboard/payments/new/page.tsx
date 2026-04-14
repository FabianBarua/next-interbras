import { getSiteDomains } from "@/lib/actions/admin/settings"
import { GatewayInstanceForm } from "../[slug]/gateway-instance-form"

const KNOWN_TYPES = [
  "commpix-pix",
  "pyxpay-pix",
  "pyxpay-card",
  "manual-cash",
  "manual-transfer",
  "manual-card",
]

export default async function NewPaymentPage() {
  const siteDomains = await getSiteDomains()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold">Nuevo Gateway</h1>
      <GatewayInstanceForm
        type=""
        slug=""
        name=""
        displayName=""
        currentCredentials={null}
        domains={[]}
        sandbox={false}
        active={true}
        siteDomains={siteDomains}
        registeredTypes={KNOWN_TYPES}
      />
    </div>
  )
}
