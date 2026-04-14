import { getAddresses } from "@/services/user"
import { getActiveCountries } from "@/services/countries"
import { requireAuth } from "@/lib/auth/get-session"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"
import { AddressManager } from "@/components/store/address-manager"

export default async function AddressesPage() {
  const user = await requireAuth()
  const [addresses, countries, dict, locale] = await Promise.all([
    getAddresses(user.id),
    getActiveCountries(),
    getDictionary(),
    getLocale(),
  ])

  const isPt = locale === "pt"

  return (
    <AddressManager
      addresses={addresses}
      countries={countries}
      locale={locale}
      dict={{
        title: dict.account.addresses,
        newAddress: dict.account.newAddress,
        primary: dict.account.primary,
        edit: dict.common.edit,
        remove: dict.common.remove,
        save: dict.checkout.saveAddress,
        saving: dict.common.processing,
        setDefault: isPt ? "Tornar principal" : "Hacer principal",
        cancel: isPt ? "Cancelar" : "Cancelar",
        address: dict.checkout.address,
        city: dict.checkout.city,
        state: dict.checkout.state,
        selectState: dict.checkout.selectState,
        selectCountry: dict.checkout.selectCountry,
        zipCode: isPt ? "CEP" : "Código Postal",
        label: isPt ? "Nome / Etiqueta" : "Nombre / Etiqueta",
        makeDefault: isPt ? "Estabelecer como principal" : "Establecer como principal",
      }}
    />
  )
}
