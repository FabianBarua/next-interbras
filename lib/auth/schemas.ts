import { z } from "zod/v4"

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  email: z.email("Email inválido").transform(v => v.trim().toLowerCase()),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(72, "Senha muito longa"),
})

export const loginSchema = z.object({
  email: z.email("Email inválido").transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, "Senha é obrigatória").max(72, "Senha muito longa"),
})

export const forgotPasswordSchema = z.object({
  email: z.email("Email inválido").transform(v => v.trim().toLowerCase()),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(64),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(72, "Senha muito longa"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
