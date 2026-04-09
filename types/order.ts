import type { I18nText } from "./common"

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

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
