import type { I18nText } from "./common"

export interface StoreLocation {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone: string
  email?: string
  businessHours: I18nText
  coordinates: {
    lat: number
    lng: number
  }
}
