import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"

/** Trusted hosts allowlist — loaded from ALLOWED_HOSTS env var (comma-separated) */
const trustedHosts = new Set(
  (process.env.ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
)

/**
 * Rewrite req.url to match the real external host from reverse proxy headers.
 * Only allows hosts in the ALLOWED_HOSTS allowlist.
 */
function withProxyUrl(handler: (req: NextRequest) => Promise<Response>) {
  return (req: NextRequest) => {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") ?? "https"

    // Validate host against allowlist to prevent host header injection
    if (host && trustedHosts.size > 0 && !trustedHosts.has(host.toLowerCase())) {
      return new Response("Forbidden", { status: 403 })
    }

    if (host && !req.url.includes(host)) {
      const original = new URL(req.url)
      const fixed = new URL(`${proto}://${host}${original.pathname}${original.search}`)
      return handler(new NextRequest(fixed, { headers: req.headers, method: req.method, body: req.body }))
    }
    return handler(req)
  }
}

export const GET = withProxyUrl(handlers.GET)
export const POST = withProxyUrl(handlers.POST)
