import type { I18nText } from "./common"

export interface ShippingMethod {
  id: string
  slug: string
  name: I18nText
  description: I18nText | null
  price: number
  active: boolean
  sortOrder: number
}
