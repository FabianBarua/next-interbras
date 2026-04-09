import { emptyCartMock } from "../mock/cart"
import type { Cart } from "../types/cart"

const DELAY = 300

export async function getCart(): Promise<Cart> {
  return new Promise((resolve) => setTimeout(() => resolve(emptyCartMock), DELAY))
}
