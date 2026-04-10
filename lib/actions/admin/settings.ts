"use server"

import { revalidatePath } from "next/cache"
import { getSetting, setSetting } from "@/lib/settings"
import { requireAdmin } from "@/lib/auth/get-session"
import { logEvent } from "@/lib/logging"

type SettingsKey = "name" | "url" | "logo" | "logoMark"

const ALLOWED_KEYS: SettingsKey[] = ["name", "url", "logo", "logoMark"]

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function isValidImagePath(value: string): boolean {
  return value.startsWith("/uploads/") || value.startsWith("/") || isValidUrl(value)
}

export async function updateSiteSettings(
  data: Partial<Record<SettingsKey, string>>,
) {
  const admin = await requireAdmin()
  const errors: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_KEYS.includes(key as SettingsKey)) continue
    const val = (value ?? "").trim()

    if (key === "url" && val && !isValidUrl(val)) {
      errors.push("URL del sitio inválida")
      continue
    }
    if ((key === "logo" || key === "logoMark") && val && !isValidImagePath(val)) {
      errors.push(`Ruta del ${key === "logo" ? "logo" : "ícono"} inválida`)
      continue
    }

    await setSetting(`site.${key}`, val)
  }

  revalidatePath("/", "layout")

  logEvent({
    category: "sistema",
    action: "update_site_settings",
    userId: admin.id,
    meta: { keys: Object.keys(data) },
  })

  if (errors.length > 0) {
    return { error: errors.join(". ") }
  }
  return { success: true }
}

// ─── Timezone ────────────────────────────────

const IANA_TZ_RE = /^([A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?|UTC)$/

export async function getTimezoneSettingValue(): Promise<string> {
  await requireAdmin()
  return (await getSetting("site.timezone")) ?? "America/Sao_Paulo"
}

export async function saveTimezone(
  tz: string,
): Promise<{ error?: string; success?: boolean }> {
  const admin = await requireAdmin()
  const trimmed = tz.trim()
  if (!IANA_TZ_RE.test(trimmed)) {
    return {
      error: "Formato inválido. Use formato IANA, por ejemplo: America/Sao_Paulo",
    }
  }
  await setSetting("site.timezone", trimmed)
  revalidatePath("/dashboard/settings")

  logEvent({
    category: "sistema",
    action: "update_timezone",
    userId: admin.id,
    meta: { timezone: trimmed },
  })

  return { success: true }
}

// ─── Domains ─────────────────────────────────

const DOMAIN_RE = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

export async function getSiteDomains(): Promise<string[]> {
  await requireAdmin()
  const raw = await getSetting("site.domains")
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveSiteDomains(
  domains: string[],
): Promise<{ error?: string; success?: boolean }> {
  const admin = await requireAdmin()

  if (!Array.isArray(domains)) return { error: "Formato inválido" }
  if (domains.length > 20) return { error: "Máximo 20 dominios" }

  const cleaned = domains
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  for (const d of cleaned) {
    if (!DOMAIN_RE.test(d)) {
      return { error: `Dominio inválido: ${d}` }
    }
  }

  const unique = [...new Set(cleaned)]
  await setSetting("site.domains", JSON.stringify(unique))
  revalidatePath("/dashboard/settings")

  logEvent({
    category: "sistema",
    action: "update_site_domains",
    userId: admin.id,
    meta: { domains: unique },
  })

  return { success: true }
}
