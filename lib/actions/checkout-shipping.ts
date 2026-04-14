"use server"

import { z } from "zod/v4"
import { getCurrentUser } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { setCheckoutSession } from "@/lib/actions/checkout-session"
import { getShippingMethodsByCountry, getActiveCountries } from "@/services/countries"
import { getAddresses } from "@/services/user"
import { logEvent } from "@/lib/logging"

const addressSchema = z.object({
  street: z.string().min(3).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().max(20).optional(),
  countryCode: z.string().min(2).max(5),
})

const selectShippingSchema = z.object({
  countryCode: z.string().min(2).max(5),
  shippingMethodId: z.string().uuid(),
  addressId: z.string().uuid().optional(),
  newAddress: addressSchema.optional(),
})

export async function selectShippingAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "No autenticado" }

  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const rl = await rateLimit(`select-shipping:${user.id}`, 10, 60)
  if (!rl.success) {
    return { error: `Demasiados intentos. Espere ${rl.retryAfter}s.` }
  }

  const raw = {
    countryCode: formData.get("countryCode") as string,
    shippingMethodId: formData.get("shippingMethodId") as string,
    addressId: (formData.get("addressId") as string) || undefined,
    newAddress: formData.get("street")
      ? {
          street: formData.get("street") as string,
          city: formData.get("city") as string,
          state: formData.get("state") as string,
          zipCode: (formData.get("zipCode") as string) || undefined,
          countryCode: formData.get("countryCode") as string,
        }
      : undefined,
  }

  const parsed = selectShippingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { countryCode, shippingMethodId, addressId, newAddress } = parsed.data

  // Validate country exists
  const activeCountries = await getActiveCountries()
  const country = activeCountries.find((c) => c.code === countryCode)
  if (!country) return { error: "País no válido" }

  // Validate shipping method available for this country
  const methods = await getShippingMethodsByCountry(countryCode)
  const method = methods.find((m) => m.id === shippingMethodId)
  if (!method) return { error: "Método de envío no disponible para este país" }

  // Validate address if required
  if (method.requiresAddress) {
    if (!addressId && !newAddress) {
      return { error: "Dirección de envío requerida" }
    }
    // Validate saved address belongs to user
    if (addressId) {
      const userAddresses = await getAddresses(user.id)
      if (!userAddresses.find((a) => a.id === addressId)) {
        return { error: "Dirección no válida" }
      }
    }
  }

  await setCheckoutSession({
    countryCode,
    shippingMethodId,
    shippingMethodSlug: method.slug,
    requiresAddress: method.requiresAddress,
    shippingCost: Number(method.price),
    addressId,
    newAddress,
  })

  logEvent({
    category: "checkout",
    action: "shipping_selected",
    meta: { userId: user.id, countryCode, shippingMethod: method.slug },
  })

  return { success: true }
}
