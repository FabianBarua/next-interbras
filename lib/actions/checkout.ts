"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { createOrder, type CreateOrderInput } from "@/services/orders"

const addressSchema = z.object({
  street: z.string().min(3).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().max(20).optional(),
  country: z.string().min(2).max(50),
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
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  notes: z.string().max(500).optional(),
  items: z.array(checkoutItemSchema).min(1).max(50),
})

const SHIPPING_COSTS: Record<string, number> = {
  standard: 8.50,
  express: 15.00,
  pickup: 0,
}

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
    return { error: parsed.error.issues[0].message }
  }

  const { shippingMethod, ...rest } = parsed.data
  const shippingCost = SHIPPING_COSTS[shippingMethod] ?? 0

  try {
    const orderId = await createOrder({
      userId,
      ...rest,
      shippingMethod,
      shippingCost,
      paymentMethod: "cash",
    })
    return { orderId }
  } catch (err: any) {
    return { error: err?.message ?? "Error al crear el pedido." }
  }
}
