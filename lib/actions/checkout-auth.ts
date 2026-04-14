"use server"

import bcrypt from "bcryptjs"
import { z } from "zod/v4"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { signIn } from "@/lib/auth"
import { getCurrentUser } from "@/lib/auth/get-session"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { logEvent } from "@/lib/logging"
import { sendEmail } from "@/lib/email/send"
import { getRequestUrl } from "@/lib/get-base-url"
import { AuthError } from "next-auth"
import { invalidateCache } from "@/lib/cache"

// ── Schemas ──────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(72, "Senha muito longa")
  .refine(
    (pw) => /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw),
    "Senha deve conter pelo menos uma letra e um número",
  )

const checkoutLoginSchema = z.object({
  email: z.email("Email inválido").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Senha é obrigatória").max(72),
})

const checkoutRegisterSchema = z.object({
  name: z.string().trim().min(2, "Nome: mín. 2 caracteres").max(100),
  email: z.email("Email inválido").transform((v) => v.trim().toLowerCase()),
  password: passwordSchema,
  phone: z.string().trim().min(5, "Telefone inválido").max(50),
  documentType: z.enum(["CI", "CPF", "RG", "OTRO"]),
  documentNumber: z.string().trim().min(3, "Documento inválido").max(30),
  nationality: z.string().trim().min(2, "Nacionalidade inválida").max(100).optional(),
})

const completeProfileSchema = z.object({
  phone: z.string().trim().min(5, "Telefone inválido").max(50).optional(),
  documentType: z.enum(["CI", "CPF", "RG", "OTRO"]).optional(),
  documentNumber: z.string().trim().min(3, "Documento inválido").max(30).optional(),
  nationality: z.string().trim().min(2).max(100).optional(),
  name: z.string().trim().min(2).max(100).optional(),
})

// ── Helpers ──────────────────────────────────────────────────────────

async function getIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  return h.get("x-real-ip") || (forwarded ? forwarded.split(",").pop()?.trim() ?? "unknown" : "unknown")
}

// ── Login Action ─────────────────────────────────────────────────────

export async function checkoutLoginAction(formData: FormData) {
  const ip = await getIp()
  const rl = await rateLimit(`checkout-login:${ip}`, 5, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = checkoutLoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      logEvent({ category: "auth", action: "checkout_login_failed", meta: { ip, email: parsed.data.email } })
      return { error: "Email ou senha inválidos" }
    }
    throw error
  }

  logEvent({ category: "auth", action: "checkout_login_success", meta: { ip, email: parsed.data.email } })
  return { success: true }
}

// ── Register Action ──────────────────────────────────────────────────

export async function checkoutRegisterAction(formData: FormData) {
  const ip = await getIp()
  const rl = await rateLimit(`checkout-register:${ip}`, 3, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phone: formData.get("phone") as string,
    documentType: formData.get("documentType") as string,
    documentNumber: formData.get("documentNumber") as string,
    nationality: formData.get("nationality") as string || undefined,
  }

  const parsed = checkoutRegisterSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, password, phone, documentType, documentNumber, nationality } = parsed.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existing) {
    logEvent({ category: "auth", action: "checkout_register_duplicate", meta: { ip, email } })
    return { error: "Não foi possível criar a conta. Se já possui conta, tente fazer login." }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    await db.insert(users).values({
      name,
      email,
      passwordHash,
      phone,
      documentType,
      documentNumber,
      nationality: nationality || null,
    })
  } catch {
    return { error: "Não foi possível criar a conta. Tente outro email." }
  }

  const siteUrl = await getRequestUrl()
  await sendEmail(email, "welcome", { nome: name, siteUrl })

  logEvent({ category: "auth", action: "checkout_register_success", meta: { ip, email } })

  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch {
    // Non-critical — account was created
  }

  return { success: true }
}

// ── Complete Profile Action ──────────────────────────────────────────

export async function completeProfileAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Não autenticado" }

  const rl = await rateLimit(`complete-profile:${user.id}`, 10, 60)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw: Record<string, string | undefined> = {}
  for (const key of ["phone", "documentType", "documentNumber", "nationality", "name"]) {
    const val = formData.get(key) as string | null
    if (val && val.trim()) raw[key] = val.trim()
  }

  const parsed = completeProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const updates: Record<string, string | null> = {}
  if (parsed.data.phone) updates.phone = parsed.data.phone
  if (parsed.data.documentType) updates.documentType = parsed.data.documentType
  if (parsed.data.documentNumber) updates.documentNumber = parsed.data.documentNumber
  if (parsed.data.nationality) updates.nationality = parsed.data.nationality
  if (parsed.data.name) updates.name = parsed.data.name

  if (Object.keys(updates).length === 0) {
    return { error: "Nenhum campo para atualizar" }
  }

  await db.update(users).set(updates).where(eq(users.id, user.id))
  await invalidateCache(`profile:user:${user.id}`)

  logEvent({ category: "auth", action: "checkout_profile_complete", meta: { userId: user.id } })
  return { success: true }
}
