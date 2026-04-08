import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"

/**
 * Rewrite req.url to match the real external host from reverse proxy headers.
 */
function withProxyUrl(handler: (req: NextRequest) => Promise<Response>) {
  return (req: NextRequest) => {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") ?? "https"
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
