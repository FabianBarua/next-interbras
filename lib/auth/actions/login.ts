"use server"

import { signIn } from "@/lib/auth"
import { loginSchema } from "@/lib/auth/schemas"
import { AuthError } from "next-auth"
import { rateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"

export async function login(formData: FormData) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
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
      if (error.type === "CredentialsSignin") {
        return { error: "Email ou senha inválidos" }
      }
      return { error: "Erro ao fazer login" }
    }
    throw error
  }

  return { success: true }
}
