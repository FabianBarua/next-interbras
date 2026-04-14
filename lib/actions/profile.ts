"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth/get-session"
import { db } from "@/lib/db"
import { users, addresses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { invalidateCache } from "@/lib/cache"
import bcrypt from "bcryptjs"

import { rateLimit } from "@/lib/rate-limit"

// ---------------------------------------------------------------------------
// Update profile (name, phone, document, nationality)
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(50).optional(),
  documentType: z.enum(["CI", "CPF", "RG", "OTRO"]).optional(),
  documentNumber: z.string().max(30).optional(),
  nationality: z.string().max(100).optional(),
})

export async function updateProfileAction(data: unknown) {
  const user = await requireAuth()
  const userId = user.id

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await db.update(users).set({
    name: parsed.data.name,
    phone: parsed.data.phone ?? null,
    documentType: parsed.data.documentType ?? null,
    documentNumber: parsed.data.documentNumber ?? null,
    nationality: parsed.data.nationality ?? null,
  }).where(eq(users.id, userId))

  await invalidateCache(`profile:user:${userId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Update password
// ---------------------------------------------------------------------------

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
})

export async function updatePasswordAction(data: unknown) {
  const user = await requireAuth()
  const userId = user.id

  const parsed = passwordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const [dbUser] = await db.select({ passwordHash: users.passwordHash })
    .from(users).where(eq(users.id, userId)).limit(1)

  if (!dbUser?.passwordHash) {
    return { error: "Cuenta vinculada con OAuth. No se puede cambiar la contraseña." }
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash)
  if (!valid) {
    return { error: "Contraseña actual incorrecta." }
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await db.update(users).set({
    passwordHash: newHash,
    passwordChangedAt: new Date(),
  }).where(eq(users.id, userId))

  return { success: true }
}

// ---------------------------------------------------------------------------
// Address CRUD
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  label: z.string().max(100).optional(),
  street: z.string().min(3).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().max(20).optional(),
  countryCode: z.string().min(2).max(5).default("PY"),
  isDefault: z.boolean().default(false),
})

export async function createAddressAction(data: unknown) {
  const user = await requireAuth()
  const userId = user.id

  const rl = await rateLimit(`create-address:${userId}`, 10, 60)
  if (!rl.success) {
    return { error: `Demasiados intentos. Intente de nuevo en ${rl.retryAfter}s.` }
  }

  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (parsed.data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  }

  const [addr] = await db.insert(addresses).values({
    userId,
    label: parsed.data.label,
    street: parsed.data.street,
    city: parsed.data.city,
    state: parsed.data.state,
    zipCode: parsed.data.zipCode,
    countryCode: parsed.data.countryCode,
    isDefault: parsed.data.isDefault,
  }).returning({ id: addresses.id })

  await invalidateCache(`profile:user:${userId}`)
  return { id: addr.id }
}

export async function deleteAddressAction(addressId: string) {
  const user = await requireAuth()
  const userId = user.id

  await db.delete(addresses).where(
    and(eq(addresses.id, addressId), eq(addresses.userId, userId))
  )

  await invalidateCache(`profile:user:${userId}`)
  return { success: true }
}

export async function updateAddressAction(addressId: string, data: unknown) {
  const user = await requireAuth()
  const userId = user.id

  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (parsed.data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  }

  await db.update(addresses).set({
    label: parsed.data.label,
    street: parsed.data.street,
    city: parsed.data.city,
    state: parsed.data.state,
    zipCode: parsed.data.zipCode,
    countryCode: parsed.data.countryCode,
    isDefault: parsed.data.isDefault,
  }).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))

  await invalidateCache(`profile:user:${userId}`)
  return { success: true }
}

export async function setDefaultAddressAction(addressId: string) {
  const user = await requireAuth()
  const userId = user.id

  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  await db.update(addresses).set({ isDefault: true }).where(
    and(eq(addresses.id, addressId), eq(addresses.userId, userId))
  )

  await invalidateCache(`profile:user:${userId}`)
  return { success: true }
}
