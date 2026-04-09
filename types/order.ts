import type { I18nText } from "./common"

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

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
