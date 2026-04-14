export interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  countryCode: string
  isDefault: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  documentType: string | null
  documentNumber: string | null
  nationality: string | null
  addresses: Address[]
}
