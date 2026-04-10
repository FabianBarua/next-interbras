"use server"

import crypto from "crypto"
import bcrypt from "bcryptjs"
import { eq, and, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { resetPasswordSchema } from "@/lib/auth/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function resetPassword(formData: FormData) {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const ip = headersList.get("x-real-ip")
    || (forwarded ? forwarded.split(",").pop()?.trim() : null)
    || "unknown"
  const rl = await rateLimit(`reset-password:${ip}`, 5, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
  }

  const result = resetPasswordSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const tokenHash = hashToken(result.data.token)

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      gt(passwordResetTokens.expiresAt, new Date()),
    ),
  })

  if (!resetToken) {
    return { error: "Token inválido ou expirado" }
  }

  const passwordHash = await bcrypt.hash(result.data.password, 12)

  const user = await db.query.users.findFirst({
    where: eq(users.id, resetToken.userId),
    columns: { id: true, email: true },
  })
  if (!user) return { error: "Usuário não encontrado" }

  await db
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date() })
    .where(eq(users.id, resetToken.userId))

  // Delete all tokens for this user
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, resetToken.userId))

  // Auto-login after password reset
  try {
    await signIn("credentials", {
      email: user.email,
      password: result.data.password,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Erro ao fazer login automático" }
    }
    throw error
  }

  return { success: true }
}
