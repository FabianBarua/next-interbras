import { notFound } from "next/navigation"
import {
  getGatewayInstanceBySlug,
  getDecryptedCredentials,
} from "@/lib/actions/admin/gateway-config"
import { getSiteDomains } from "@/lib/actions/admin/settings"
import { GatewayInstanceForm } from "./gateway-instance-form"

const KNOWN_TYPES = ["commpix-pix", "pyxpay-pix", "manual-transfer"]

const PLACEHOLDERS: Record<string, string> = {
  "commpix-pix": JSON.stringify(
    {
      email: "",
      password: "",
      webhookSecret: "",
      apiUrl: "https://api.commpix.com",
      currency: "BRL",
      nature: "SERVICES_AND_OTHERS",
    },
    null,
    2,
  ),
  "pyxpay-pix": JSON.stringify({ apiKey: "", taxa: 2.5 }, null, 2),
}

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const inst = await getGatewayInstanceBySlug(slug)
  if (!inst) notFound()

  const [creds, siteDomains] = await Promise.all([
    getDecryptedCredentials(slug),
    getSiteDomains(),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold">Editar Gateway</h1>
      <GatewayInstanceForm
        id={inst.id}
        type={inst.type}
        slug={inst.slug}
        name={inst.name ?? ""}
        displayName={inst.displayName ?? ""}
        currentCredentials={creds}
        domains={(inst.domains as string[]) ?? []}
        sandbox={inst.sandbox}
        active={inst.active}
        siteDomains={siteDomains}
        registeredTypes={KNOWN_TYPES}
        credentialPlaceholder={PLACEHOLDERS[inst.type]}
        isEdit
      />
    </div>
  )
}
