import type { I18nText } from "./common"

export interface OrderStatusRecord {
  id: string
  slug: string
  name: I18nText
  description: I18nText | null
  color: string
  icon: string
  isFinal: boolean
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderFlow {
  id: string
  name: I18nText
  description: I18nText | null
  shippingMethodId: string | null
  gatewayType: string | null
  isDefault: boolean
  active: boolean
  steps: OrderFlowStep[]
  createdAt: string
  updatedAt: string
}

export interface OrderFlowStep {
  id: string
  flowId: string
  statusSlug: string
  stepOrder: number
  autoTransition: boolean
  notifyCustomer: boolean
  createdAt: string
  status?: OrderStatusRecord
}
