import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/get-session"
import { getShippingMethodById } from "@/services/shipping-methods"
import { getAllCountries } from "@/services/admin/countries"
import { getCountriesForShippingMethod } from "@/lib/actions/admin/shipping-countries"
import { getPaymentRulesForShippingMethod, getAllGatewayTypes } from "@/lib/actions/admin/shipping-payment-rules"
import { ShippingMethodEditForm } from "./client"

export default async function EditShippingMethodPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const method = await getShippingMethodById(id)
  if (!method) notFound()

  const [allCountries, assignedCountries, allGatewayTypes, assignedPayments] = await Promise.all([
    getAllCountries(),
    getCountriesForShippingMethod(id),
    getAllGatewayTypes(),
    getPaymentRulesForShippingMethod(id),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Editar método de envío</h1>
        <p className="text-sm text-muted-foreground">{method.name.es ?? method.slug}</p>
      </div>
      <ShippingMethodEditForm
        method={method}
        allCountries={allCountries}
        assignedCountryIds={assignedCountries.map((c) => c.countryId)}
        allGatewayTypes={allGatewayTypes}
        assignedGatewayTypes={assignedPayments}
      />
    </div>
  )
}
