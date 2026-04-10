"use server"

import { signIn } from "@/lib/auth"
import { loginSchema } from "@/lib/auth/schemas"
import { AuthError } from "next-auth"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import { logEvent } from "@/lib/logging"

export async function login(formData: FormData) {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const ip = headersList.get("x-real-ip")
    || (forwarded ? forwarded.split(",").pop()?.trim() : null)
    || "unknown"
  const rl = await rateLimit(`login:${ip}`, 5, 300)
  if (!rl.success) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` }
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirectTo: "/",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      logEvent({ category: "auth", action: "login_failed", message: error.type, meta: { ip, email: result.data.email } })
      if (error.type === "CredentialsSignin") {
        return { error: "Email ou senha inválidos" }
      }
      return { error: "Erro ao fazer login" }
    }
    throw error
  }

  logEvent({ category: "auth", action: "login_success", meta: { ip, email: result.data.email } })
  return { success: true }
}
