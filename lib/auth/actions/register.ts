"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { registerSchema } from "@/lib/auth/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email/send"
import { getRequestUrl } from "@/lib/get-base-url"
import { signIn } from "@/lib/auth"
import { headers } from "next/headers"

export async function register(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const rl = await rateLimit(`register:${ip}`, 5, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { name, email, password } = result.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existing) {
    return { error: "Este email já está cadastrado.", loginHint: true }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    await db.insert(users).values({
      name,
      email,
      passwordHash,
    })
  } catch {
    // UNIQUE constraint violation (race condition with concurrent request)
    return { error: "Não foi possível criar a conta. Tente outro email." }
  }

  const siteUrl = await getRequestUrl()
  await sendEmail(email, "welcome", { nome: name, siteUrl })

  // Auto sign-in after registration
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
  } catch {
    // Sign-in failure is non-critical — account was still created
  }

  return { success: true, redirect: "/" }
}
