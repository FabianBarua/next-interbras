"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { createOrder, type CreateOrderInput } from "@/services/orders"
import { getShippingMethodBySlug } from "@/services/shipping-methods"

const addressSchema = z.object({
  street: z.string().min(3).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().max(20).optional(),
  countryCode: z.string().min(2).max(5),
})

const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
})

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().max(50).optional(),
  customerDocument: z.string().max(30).optional(),
  shippingAddress: addressSchema,
  shippingMethod: z.string().min(1).max(50),
  paymentMethod: z.string().min(1).max(50),
  notes: z.string().max(500).optional(),
  items: z.array(checkoutItemSchema).min(1).max(50),
})

export async function createOrderAction(data: unknown) {
  const user = await requireAuth()
  const userId = user.id

  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const rl = await rateLimit(`checkout:${userId}`, 3, 300)
  if (!rl.success) {
    return { error: `Demasiados intentos. Espere ${rl.retryAfter}s.` }
  }

  const parsed = checkoutSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Datos inválidos. Revisa el formulario." }
  }

  const { shippingMethod, paymentMethod, ...rest } = parsed.data

  const shippingRecord = await getShippingMethodBySlug(shippingMethod)

  if (!shippingRecord || !shippingRecord.active) {
    return { error: "Método de envío no válido." }
  }

  const shippingCost = shippingRecord.price

  try {
    const orderId = await createOrder({
      userId,
      ...rest,
      shippingMethod,
      shippingCost,
      paymentMethod: paymentMethod as "cash" | "card" | "transfer" | "pix",
    })
    return { orderId }
  } catch (err) {
    console.error("[checkout] Order creation failed", err)
    return { error: "Error al procesar el pedido." }
  }
}
