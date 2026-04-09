"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from "@/services/payment-types"

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const createSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  icon: z.string().max(30).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const updateSchema = createSchema.partial()

export async function createPaymentTypeAction(data: unknown) {
  await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    const id = await createPaymentType(parsed.data)
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear tipo de pago." }
  }
}

export async function updatePaymentTypeAction(id: string, data: unknown) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await updatePaymentType(id, parsed.data)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deletePaymentTypeAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  await deletePaymentType(id)
  return { success: true }
}
