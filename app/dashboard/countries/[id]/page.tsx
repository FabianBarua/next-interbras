import { requireAdmin } from "@/lib/auth/get-session"
import { getCountryById } from "@/services/admin/countries"
import { notFound } from "next/navigation"
import { CountryEditForm } from "./client"

export default async function EditCountryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const country = await getCountryById(id)
  if (!country) notFound()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar país</h1>
        <p className="text-sm text-muted-foreground">{country.flag} {country.name.es || country.code}</p>
      </div>
      <CountryEditForm country={country} />
    </div>
  )
}
