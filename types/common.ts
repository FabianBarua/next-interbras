import type { I18nText, I18nRichText, I18nSpecs } from "@/lib/db/schema/i18n-helpers"

export type { I18nText, I18nRichText, I18nSpecs }

export type Locale = "es" | "pt"

export interface SiteConfig {
  name: string
  description: I18nText
  contact: {
    email: string
    phone: string
    whatsapp: string
  }
  social: {
    facebook: string
    instagram: string
    youtube: string
  }
}
