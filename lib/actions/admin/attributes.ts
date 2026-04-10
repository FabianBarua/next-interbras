"use server"

import { z } from "zod"
import { requireAdmin } from "@/lib/auth/get-session"
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  bulkDeleteAttributes,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  bulkCreateAttributeValues,
} from "@/services/admin/attributes"
import { logEvent } from "@/lib/logging"

const uuidSchema = z.string().uuid()
const uuidArraySchema = z.array(z.string().uuid()).min(1).max(200)

const i18nTextSchema = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  { message: "At least one locale required" },
)

const createSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  description: i18nTextSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

const updateSchema = createSchema.partial()

export async function createAttributeAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = createSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const id = await createAttribute(parsed.data)
    logEvent({ category: "admin", action: "attribute.create", entity: "attribute", entityId: id, userId: session.id })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear atributo." }
  }
}

export async function updateAttributeAction(id: string, data: unknown) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  const parsed = updateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateAttribute(id, parsed.data)
    logEvent({ category: "admin", action: "attribute.update", entity: "attribute", entityId: id, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteAttributeAction(id: string) {
  const session = await requireAdmin()
  const idParsed = uuidSchema.safeParse(id)
  if (!idParsed.success) return { error: "ID inválido." }
  try {
    await deleteAttribute(id)
    logEvent({ category: "admin", action: "attribute.delete", entity: "attribute", entityId: id, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar atributo." }
  }
}

export async function bulkDeleteAttributesAction(ids: unknown) {
  const session = await requireAdmin()
  const parsed = uuidArraySchema.safeParse(ids)
  if (!parsed.success) return { error: "IDs inválidos." }
  const deleted = await bulkDeleteAttributes(parsed.data)
  logEvent({ category: "admin", action: "attribute.bulk_delete", entity: "attribute", userId: session.id, meta: { count: deleted } })
  return { deleted }
}

// Attribute values
const valueCreateSchema = z.object({
  attributeId: z.string().uuid(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: i18nTextSchema,
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

const valueUpdateSchema = valueCreateSchema.omit({ attributeId: true }).partial()

export async function createAttributeValueAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = valueCreateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const id = await createAttributeValue(parsed.data)
    logEvent({ category: "admin", action: "attribute_value.create", entity: "attribute_value", userId: session.id, meta: { attributeId: parsed.data.attributeId } })
    return { id }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al crear valor." }
  }
}

export async function updateAttributeValueAction(id: unknown, data: unknown) {
  const session = await requireAdmin()
  const parsed_id = uuidSchema.safeParse(id)
  if (!parsed_id.success) return { error: "ID inválido." }
  const parsed = valueUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    await updateAttributeValue(parsed_id.data, parsed.data)
    logEvent({ category: "admin", action: "attribute_value.update", entity: "attribute_value", entityId: parsed_id.data, userId: session.id })
    return { success: true }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "El slug ya existe." }
    return { error: "Error al actualizar." }
  }
}

export async function deleteAttributeValueAction(id: unknown) {
  const session = await requireAdmin()
  const parsed_id = uuidSchema.safeParse(id)
  if (!parsed_id.success) return { error: "ID inválido." }
  try {
    await deleteAttributeValue(parsed_id.data)
    logEvent({ category: "admin", action: "attribute_value.delete", entity: "attribute_value", entityId: parsed_id.data, userId: session.id })
    return { success: true }
  } catch {
    return { error: "Error al eliminar valor." }
  }
}

const bulkValueSchema = z.array(valueCreateSchema).min(1).max(100)

export async function bulkCreateAttributeValuesAction(data: unknown) {
  const session = await requireAdmin()
  const parsed = bulkValueSchema.safeParse(data)
  if (!parsed.success) return { error: "Datos inválidos." }
  try {
    const ids = await bulkCreateAttributeValues(parsed.data)
    logEvent({ category: "admin", action: "attribute_value.bulk_create", entity: "attribute_value", userId: session.id, meta: { count: parsed.data.length } })
    return { ids }
  } catch (err: any) {
    if (err?.code === "23505") return { error: "Slug duplicado." }
    return { error: "Error al crear valores." }
  }
}
