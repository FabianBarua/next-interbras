import { unstable_cache } from "next/cache"
import { getSetting } from "@/lib/settings"

export interface SiteConfig {
  name: string
  url: string
  logo: string | null
  logoMark: string | null
}

const DEFAULTS: SiteConfig = {
  name: "Interbras",
  url: "http://localhost:3000",
  logo: null,
  logoMark: null,
}

export const getSiteConfig = unstable_cache(
  async (): Promise<SiteConfig> => {
    try {
      const name = (await getSetting("site.name")) ?? DEFAULTS.name
      const url = (await getSetting("site.url")) ?? DEFAULTS.url
      const logo = await getSetting("site.logo")
      const logoMark = await getSetting("site.logoMark")

      return { name, url, logo, logoMark }
    } catch {
      return { ...DEFAULTS }
    }
  },
  ["site-config"],
  { revalidate: 60, tags: ["site-config"] },
)
