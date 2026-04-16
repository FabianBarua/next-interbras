import { headers } from "next/headers"

/**
 * Canonical site URL from env vars — for webhooks, background jobs, and
 * any context where there is no incoming request.
 */
export function getSiteUrl(): string {
  return process.env.SITE_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"
}

/**
 * Derive the base URL from the current request headers.
 * Falls back to env vars when not in a request context.
 */
export async function getRequestUrl(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    const proto = h.get("x-forwarded-proto") ?? "https"
    if (host && isAllowedHost(host)) return `${proto}://${host}`
  } catch {
    // Not in a request context
  }
  return getSiteUrl()
}

/** Validate that the host matches one of the configured allowed hosts. */
function isAllowedHost(host: string): boolean {
  const raw = process.env.ALLOWED_HOSTS
  if (!raw) return true // no restriction configured
  const normalized = host.toLowerCase().split(":")[0]
  return raw.split(",").some((h) => h.trim().toLowerCase() === normalized)
}
