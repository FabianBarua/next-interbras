import { userProfileMock } from "../mock/user"
import type { UserProfile, Address } from "../types/user"

const DELAY = 500

export async function getUserProfile(): Promise<UserProfile> {
  return new Promise((resolve) => setTimeout(() => resolve(userProfileMock), DELAY))
}

export async function getAddresses(): Promise<Address[]> {
  return new Promise((resolve) => setTimeout(() => resolve(userProfileMock.addresses), DELAY))
}
