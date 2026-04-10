"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { coupons } from "@/lib/db/schema"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"

interface ValidateCouponResult {
  valid: boolean
  error?: string
  type?: "percent" | "fixed"
  value?: number
  discount?: number
}

export async function validateCoupon(
  code: string,
  subtotalCents: number,
): Promise<ValidateCouponResult> {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const rl = await rateLimit(`coupon:${ip}`, 20, 60)
  if (!rl.success) {
    return { valid: false, error: "Muchos intentos. Espere un momento." }
  }

  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Ingrese el código del cupón" }
  }

  if (code.trim().length > 50) {
    return { valid: false, error: "Código de cupón inválido" }
  }

  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.trim().toUpperCase()),
  })

  if (!coupon || !coupon.active) {
    return { valid: false, error: "Cupón inválido" }
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "Cupón expirado" }
  }

  if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
    return { valid: false, error: "Cupón agotado" }
  }

  if (coupon.minAmount && subtotalCents < coupon.minAmount) {
    return {
      valid: false,
      error: `Monto mínimo para este cupón: $${(coupon.minAmount / 100).toFixed(2)}`,
    }
  }

  let discount: number
  if (coupon.type === "percent") {
    discount = Math.round(subtotalCents * (coupon.value / 100))
  } else {
    discount = Math.min(coupon.value, subtotalCents)
  }

  return {
    valid: true,
    type: coupon.type,
    value: coupon.value,
    discount,
  }
}
