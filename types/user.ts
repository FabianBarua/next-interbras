export interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  addresses: Address[]
}
