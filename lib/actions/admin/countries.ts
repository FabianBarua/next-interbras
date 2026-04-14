"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createCountry,
  updateCountry,
  deleteCountry,
} from "@/services/admin/countries"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const createSchema = z.object({
  code: z.string().min(2).max(5).regex(/^[A-Za-z]+$/),
  name: i18nTextSchema,
  flag: z.string().min(1).max(10),
  currency: z.string().min(1).max(5),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const updateSchema = createSchema.partial()

export async function createCountryAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    const id = await createCountry(parsed.data)
    logEvent({ category: "admin", action: "country.create", entity: "country", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código de país ya existe." }
    return { error: "Error al crear país." }
  }
}

export async function updateCountryAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }

  try {
    await updateCountry(id, parsed.data)
    logEvent({ category: "admin", action: "country.update", entity: "country", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código de país ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteCountryAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  await deleteCountry(id)
  logEvent({ category: "admin", action: "country.delete", entity: "country", entityId: id, userId: session.id })
  return { success: true }
}
