import type { I18nText } from "./common"

export interface Brand {
  id: string
  name: string
  logoUrl: string
  description?: I18nText
}
