import { getSiteConfig } from "@/lib/site-config"
import { getTimezoneSettingValue, getSiteDomains, getEcommerceStatus } from "@/lib/actions/admin/settings"
import { SiteUrlSettings } from "./site-url-settings"
import { SiteDomainsSettings } from "./site-domains-settings"
import { TimezoneSettings } from "./timezone-settings"
import { EcommerceSettings } from "./ecommerce-settings"

export default async function SettingsPage() {
  const [config, timezone, domains, ecommerceEnabled] = await Promise.all([
    getSiteConfig(),
    getTimezoneSettingValue(),
    getSiteDomains(),
    getEcommerceStatus(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuraciones</h1>
        <p className="text-sm text-muted-foreground">
          Configuraciones generales del sitio.
        </p>
      </div>

      <SiteUrlSettings initialUrl={config.url} />

      <SiteDomainsSettings initialDomains={domains} />

      <TimezoneSettings initialTimezone={timezone} />

      <EcommerceSettings initialEnabled={ecommerceEnabled} />
    </div>
  )
}
