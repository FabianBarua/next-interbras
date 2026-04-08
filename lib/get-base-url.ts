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
    if (host) return `${proto}://${host}`
  } catch {
    // Not in a request context
  }
  return getSiteUrl()
}
