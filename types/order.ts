import type { I18nText } from "./common"

export type OrderStatus = string

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  productName: I18nText
  quantity: number
  price: number
  currency: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  totalAmount: number
  currency: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
  paymentInfo?: OrderPaymentSummary | null
}

/** Payment status info exposed to client */
export interface OrderPaymentSummary {
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded"
  gateway: string | null
  paidAt: string | null
  hasReceipt: boolean
}

/** Extended order for the authenticated detail page */
export interface DetailOrder extends Order {
  paymentMethod: string
  shippingMethod: string | null
  shippingCost: number
  subtotal: number
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  } | null
  trackingCode: string | null
  paymentInfo?: OrderPaymentSummary | null
}

export interface AdminOrder extends Order {
  customerName: string
  customerEmail: string
  customerPhone: string | null
  customerDocument: string | null
  paymentMethod: string
  shippingMethod: string | null
  shippingCost: number
  subtotal: number
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  } | null
  trackingCode: string | null
  notes: string | null
}
