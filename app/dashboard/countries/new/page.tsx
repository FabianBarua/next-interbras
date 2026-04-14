import { requireAdmin } from "@/lib/auth/get-session"
import { CountryForm } from "./client"

export default async function NewCountryPage() {
  await requireAdmin()
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Nuevo país</h1>
        <p className="text-sm text-muted-foreground">Crear un nuevo país para el checkout</p>
      </div>
      <CountryForm />
    </div>
  )
}
