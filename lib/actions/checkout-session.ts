"use server"

import { cookies } from "next/headers"
import { encrypt, decrypt } from "@/lib/crypto"

export interface CheckoutSessionAddress {
  street: string
  city: string
  state: string
  zipCode?: string
  countryCode: string
}

export interface CheckoutSession {
  countryCode: string
  shippingMethodId: string
  shippingMethodSlug: string
  requiresAddress: boolean
  shippingCost: number
  addressId?: string
  newAddress?: CheckoutSessionAddress
  saveNewAddress?: boolean
}

const COOKIE_NAME = "checkout-session"
const MAX_AGE = 60 * 60 // 1 hour

export async function getCheckoutSession(): Promise<CheckoutSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const json = decrypt(raw)
    return JSON.parse(json) as CheckoutSession
  } catch {
    return null
  }
}

export async function setCheckoutSession(data: CheckoutSession): Promise<void> {
  const cookieStore = await cookies()
  const encrypted = encrypt(JSON.stringify(data))
  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  })
}

export async function clearCheckoutSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
