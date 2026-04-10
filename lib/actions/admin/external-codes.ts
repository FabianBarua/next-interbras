"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  updateExternalCode,
  deleteExternalCode,
  bulkUpdatePrices,
} from "@/services/admin/external-codes"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()

const updateSchema = z.object({
  system: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(100).optional(),
  externalName: z.string().max(255).nullable().optional(),
  priceUsd: z.string().max(20).nullable().optional(),
  priceGs: z.string().max(20).nullable().optional(),
  priceBrl: z.string().max(20).nullable().optional(),
})

export async function updateExternalCodeAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateExternalCode(id, parsed.data)
    logEvent({ category: "admin", action: "external_code.update", entity: "external_code", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteExternalCodeAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteExternalCode(id)
    logEvent({ category: "admin", action: "external_code.delete", entity: "external_code", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar." }
  }
}

const bulkPriceSchema = z.array(z.object({
  id: z.string().uuid(),
  priceUsd: z.string().max(20).optional(),
  priceGs: z.string().max(20).optional(),
  priceBrl: z.string().max(20).optional(),
})).min(1).max(200)

export async function bulkUpdatePricesAction(data: unknown) {
  await requireAdmin()
  const parsed = bulkPriceSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const updated = await bulkUpdatePrices(parsed.data)
    return { updated }
  } catch {
    return { error: "Error al actualizar precios." }
  }
}
