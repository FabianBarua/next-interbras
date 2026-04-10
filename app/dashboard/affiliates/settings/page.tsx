import { getAffiliateSettings } from "@/lib/actions/admin/affiliates"
import { AffiliateSettingsForm } from "@/components/dashboard/affiliate-settings-form"

export default async function AffiliateSettingsPage() {
  const settings = await getAffiliateSettings()

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">
        Configuración del programa de afiliados
      </h2>
      <AffiliateSettingsForm defaultRate={settings.defaultCommissionRate} cookieDays={settings.cookieDays} />
    </div>
  )
}
