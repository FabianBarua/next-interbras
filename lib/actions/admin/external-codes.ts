"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  updateExternalCode,
  deleteExternalCode,
  bulkUpdatePrices,
} from "@/services/admin/external-codes"

const updateSchema = z.object({
  system: z.string().min(1).max(50).optional(),
  code: z.string().min(1).max(100).optional(),
  externalName: z.string().max(255).nullable().optional(),
  priceUsd: z.string().max(20).nullable().optional(),
  priceGs: z.string().max(20).nullable().optional(),
  priceBrl: z.string().max(20).nullable().optional(),
})

export async function updateExternalCodeAction(id: string, data: unknown) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateExternalCode(id, parsed.data)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El código ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteExternalCodeAction(id: string) {
  await requireAdmin()
  if (!id) return { error: "ID requerido." }
  try {
    await deleteExternalCode(id)
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
