"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { gatewayConfig } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/crypto"
import { requireAdmin } from "@/lib/auth/get-session"
import { cachedQuery, invalidateCache } from "@/lib/cache"

// ─── Types ───

export type GatewayConfigState = {
  error?: string
  success?: boolean
}

export type GatewayInstance = {
  slug: string
  displayName: string
  type: string
}

// Known gateway types — extend as new gateways are added
const KNOWN_GATEWAY_TYPES = [
  "commpix-pix",
  "pyxpay-pix",
  "pyxpay-card",
  "manual-cash",
  "manual-transfer",
  "manual-card",
]

// ─── Domain Resolution ───

export async function getActiveGatewaysForDomain(
  domain: string,
): Promise<GatewayInstance[]> {
  const all = await cachedQuery(
    "q:gateways:all-active",
    () =>
      db.query.gatewayConfig.findMany({
        where: eq(gatewayConfig.active, true),
        columns: { slug: true, displayName: true, type: true, domains: true },
      }),
    60,
  )

  const normalizedDomain = domain.toLowerCase().split(":")[0]
  const result: GatewayInstance[] = []
  const typesWithDomainMatch = new Set<string>()

  for (const inst of all) {
    const domains = inst.domains as string[]
    if (domains.length > 0 && domains.some((d) => d.toLowerCase().split(":")[0] === normalizedDomain)) {
      result.push({ slug: inst.slug, displayName: inst.displayName, type: inst.type })
      typesWithDomainMatch.add(inst.type)
    }
  }

  for (const inst of all) {
    const domains = inst.domains as string[]
    if (domains.length === 0 && !typesWithDomainMatch.has(inst.type)) {
      result.push({ slug: inst.slug, displayName: inst.displayName, type: inst.type })
    }
  }

  return result
}

export async function getActiveGateways(): Promise<
  { name: string; displayName: string }[]
> {
  const all = await cachedQuery(
    "q:gateways:active",
    () =>
      db.query.gatewayConfig.findMany({
        where: eq(gatewayConfig.active, true),
        columns: { slug: true, displayName: true },
      }),
    60,
  )
  return all.map((g) => ({ name: g.slug, displayName: g.displayName }))
}

// ─── Instance CRUD (admin) ───

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/

export async function saveGatewayInstance(
  _prev: GatewayConfigState,
  formData: FormData,
): Promise<GatewayConfigState> {
  await requireAdmin()

  const id = (formData.get("id") as string) || null
  const type = formData.get("type") as string
  const slug = (formData.get("slug") as string)?.trim().toLowerCase()
  const name = (formData.get("name") as string)?.trim()
  const displayName = (formData.get("displayName") as string)?.trim()
  const credentials = formData.get("credentials") as string
  const sandbox = formData.get("sandbox") === "on"
  const active = formData.get("active") === "on"
  const domainsRaw = formData.get("domains") as string

  if (!type || !slug || !name || !displayName || !credentials) {
    return { error: "Complete todos los campos obligatorios" }
  }

  if (!KNOWN_GATEWAY_TYPES.includes(type)) {
    return { error: `Tipo de gateway inválido: ${type}` }
  }

  if (!SLUG_RE.test(slug)) {
    return {
      error: "Slug inválido. Use solo letras minúsculas, números y guiones (3-100 chars)",
    }
  }

  try {
    JSON.parse(credentials)
  } catch {
    return { error: "Las credenciales deben ser un JSON válido" }
  }

  let domains: string[] = []
  if (domainsRaw) {
    try {
      domains = JSON.parse(domainsRaw)
      if (!Array.isArray(domains)) throw new Error()
    } catch {
      return { error: "Dominios inválidos" }
    }
  }

  const encrypted = encrypt(JSON.stringify(JSON.parse(credentials)))

  if (id) {
    const existing = await db.query.gatewayConfig.findFirst({
      where: eq(gatewayConfig.id, id),
    })
    if (!existing) return { error: "Instancia no encontrada" }

    await db
      .update(gatewayConfig)
      .set({ type, name, displayName, credentials: encrypted, sandbox, active, domains })
      .where(eq(gatewayConfig.id, id))
  } else {
    const dup = await db.query.gatewayConfig.findFirst({
      where: eq(gatewayConfig.slug, slug),
      columns: { id: true },
    })
    if (dup) return { error: `Slug "${slug}" ya está en uso` }

    await db.insert(gatewayConfig).values({
      type,
      slug,
      name,
      displayName,
      credentials: encrypted,
      sandbox,
      active,
      domains,
    })
  }

  await invalidateCache("q:gateways:*")
  revalidatePath("/dashboard/payments")
  revalidatePath("/checkout")
  return { success: true }
}

export async function deleteGatewayInstance(slug: string): Promise<void> {
  await requireAdmin()
  await db.delete(gatewayConfig).where(eq(gatewayConfig.slug, slug))
  await invalidateCache("q:gateways:*")
  revalidatePath("/dashboard/payments")
}

export async function toggleGatewayInstance(slug: string): Promise<void> {
  await requireAdmin()

  const config = await db.query.gatewayConfig.findFirst({
    where: eq(gatewayConfig.slug, slug),
    columns: { id: true, active: true },
  })
  if (!config) return

  await db
    .update(gatewayConfig)
    .set({ active: !config.active })
    .where(eq(gatewayConfig.id, config.id))

  await invalidateCache("q:gateways:*")
  revalidatePath("/dashboard/payments")
}

export async function getDecryptedCredentials(
  slug: string,
): Promise<string | null> {
  await requireAdmin()

  const config = await db.query.gatewayConfig.findFirst({
    where: eq(gatewayConfig.slug, slug),
    columns: { credentials: true },
  })
  if (!config) return null
  try {
    return decrypt(config.credentials)
  } catch {
    return null
  }
}

export async function getGatewayInstanceBySlug(slug: string) {
  await requireAdmin()
  const config = await db.query.gatewayConfig.findFirst({
    where: eq(gatewayConfig.slug, slug),
  })
  if (!config) return null
  return {
    ...config,
    decryptedCredentials: decrypt(config.credentials),
  }
}
