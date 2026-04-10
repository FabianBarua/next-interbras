import { z } from "zod/v4"

export const affiliateApplicationSchema = z.object({
  pixKey: z
    .string()
    .min(1, "Clave PIX es obligatoria")
    .max(255, "Clave PIX muy larga"),
  pixType: z.enum(["cpf", "email", "phone", "random"], {
    message: "Tipo de clave PIX inválido",
  }),
})

export type AffiliateApplicationInput = z.infer<typeof affiliateApplicationSchema>

const REF_CODE_RE = /^[A-Z0-9]{3,20}$/

export const affiliateUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  commissionRate: z
    .number()
    .int()
    .min(0, "Tasa mínima: 0%")
    .max(100, "Tasa máxima: 100%")
    .optional(),
  refCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .refine((v) => REF_CODE_RE.test(v), {
      message: "Código debe tener 3–20 caracteres alfanuméricos (A-Z, 0-9)",
    })
    .optional(),
  pixKey: z.string().max(255).optional(),
  pixType: z.enum(["cpf", "email", "phone", "random"]).optional(),
})

export type AffiliateUpdateInput = z.infer<typeof affiliateUpdateSchema>

export const affiliateRefCodeSchema = z.object({
  refCode: z
    .string()
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .refine((v) => REF_CODE_RE.test(v), {
      message: "Código debe tener 3–20 caracteres alfanuméricos (A-Z, 0-9)",
    }),
})
