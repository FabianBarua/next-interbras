import { ordersMock } from "../mock/orders"
import type { Order } from "../types/order"

const DELAY = 500

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve) => setTimeout(() => resolve(ordersMock), DELAY))
}

export async function getOrderById(id: string): Promise<Order | null> {
  return new Promise((resolve) => 
    setTimeout(() => {
      const order = ordersMock.find(o => o.id === id)
      resolve(order || null)
    }, DELAY)
  )
}
