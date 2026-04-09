import type { I18nText, I18nRichText } from "./common"

export interface Category {
  id: string
  slug: string
  name: I18nText
  description: I18nRichText | null
  shortDescription: I18nText | null
  image: string | null
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}
