"use server"

import crypto from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { forgotPasswordSchema } from "@/lib/auth/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email/send"
import { getRequestUrl } from "@/lib/get-base-url"
import { getClientIp } from "@/lib/get-client-ip"

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function forgotPassword(formData: FormData) {
  const ip = await getClientIp()
  const rl = await rateLimit(`forgot-password:${ip}`, 3, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = { email: formData.get("email") as string }

  const result = forgotPasswordSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, result.data.email),
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true }
  }

  // Rate limit per email: 1 reset request per hour
  const emailRl = await rateLimit(`forgot-password:${user.id}`, 1, 3600)
  if (!emailRl.success) {
    return { success: true } // Silent — prevent enumeration
  }

  // Delete old tokens for this user
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id))

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  const baseUrl = await getRequestUrl()
  const resetLink = `${baseUrl}/reset-password?token=${token}`
  await sendEmail(user.email, "password-reset", {
    nome: user.name ?? "Usuário",
    link: resetLink,
  })

  return { success: true }
}
