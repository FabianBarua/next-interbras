import { headers } from "next/headers"

/**
 * Extract the real client IP from request headers.
 * Priority: cf-connecting-ip (Cloudflare) → x-real-ip → last x-forwarded-for → "unknown"
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  )
}

/**
 * Extract the real client IP from a raw Headers object (for API routes / webhooks).
 */
export function getClientIpFromHeaders(h: Headers): string {
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  )
}
