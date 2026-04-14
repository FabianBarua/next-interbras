import { requireAdmin } from "@/lib/auth/get-session"
import { getAllCountries } from "@/services/admin/countries"
import { CountriesTable } from "./table"
import Link from "next/link"

export default async function AdminCountriesPage() {
  await requireAdmin()
  const countries = await getAllCountries()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Países</h1>
          <p className="text-sm text-muted-foreground">
            {countries.length} país{countries.length !== 1 ? "es" : ""} en total
          </p>
        </div>
        <Link
          href="/dashboard/countries/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo país
        </Link>
      </div>

      <CountriesTable items={countries} />
    </div>
  )
}
