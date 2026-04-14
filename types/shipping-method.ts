import type { I18nText } from "./common"

export interface PickupConfig {
  address?: string
  mapsUrl?: string
  hours?: string
  phone?: string
}

export interface ShippingMethod {
  id: string
  slug: string
  name: I18nText
  description: I18nText | null
  price: number
  active: boolean
  requiresAddress: boolean
  pickupConfig: PickupConfig | null
  sortOrder: number
}
