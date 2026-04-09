import type { I18nText } from "./common"

export interface Banner {
  id: string
  title: I18nText | null
  subtitle: I18nText | null
  imageUrl: string
  mobileImageUrl?: string
  linkStr?: string
  active: boolean
}

export interface HeroBanner extends Banner {
  ctaText?: I18nText
}
