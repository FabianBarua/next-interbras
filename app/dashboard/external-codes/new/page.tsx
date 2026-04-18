import { requireAdmin } from "@/lib/auth/get-session"
import { ExternalCodeForm } from "@/components/dashboard/forms/external-code-form"

export default async function NuevoCodigoExternoPage() {
  await requireAdmin()
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Nuevo código externo</h1>
      <ExternalCodeForm />
    </div>
  )
}
