import type { I18nText } from "./common"

export interface Country {
  id: string
  code: string
  name: I18nText
  flag: string
  currency: string
  active: boolean
  sortOrder: number
}
