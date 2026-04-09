import { storesMock } from "../mock/stores"
import type { StoreLocation } from "../types/store-location"

const DELAY = 500

export async function getStores(): Promise<StoreLocation[]> {
  return new Promise((resolve) => setTimeout(() => resolve(storesMock), DELAY))
}
