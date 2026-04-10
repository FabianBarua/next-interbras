import { getSiteConfig } from "@/lib/site-config"
import { getTimezoneSettingValue, getSiteDomains } from "@/lib/actions/admin/settings"
import { SiteUrlSettings } from "./site-url-settings"
import { SiteDomainsSettings } from "./site-domains-settings"
import { TimezoneSettings } from "./timezone-settings"

export default async function SettingsPage() {
  const [config, timezone, domains] = await Promise.all([
    getSiteConfig(),
    getTimezoneSettingValue(),
    getSiteDomains(),
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
    </div>
  )
}
