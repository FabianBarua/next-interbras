import type { I18nText } from "./common"

export interface PaymentType {
  id: string
  slug: string
  name: I18nText
  description: I18nText | null
  icon: string
  active: boolean
  sortOrder: number
}
