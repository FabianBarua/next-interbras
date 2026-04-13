import { requireAdmin } from "@/lib/auth/get-session"
import { ExternalCodeCreateForm } from "./client"

export default async function NuevoCodigoExternoPage() {
  await requireAdmin()
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Nuevo código externo</h1>
      <ExternalCodeCreateForm />
    </div>
  )
}
