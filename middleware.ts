import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { NextResponse } from "next/server"
import { toCanonicalPath } from "@/i18n/paths"

const { auth } = NextAuth(authConfig)

const LOCALES = ["es", "pt"]
const DEFAULT_LOCALE = "es"
const COOKIE_NAME = "NEXT_LOCALE"
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year

const publicAuthRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

// Paths that should NOT get locale prefix (API, static, etc.)
const SKIP_PREFIX = /^\/(?:api|uploads|_next|favicon\.ico|sitemap\.xml|robots\.txt|logo\.svg|newVersion|public)/

export default auth((req) => {
  const { pathname, search } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // ── Skip non-page paths (including static files by extension)
  if (SKIP_PREFIX.test(pathname) || /\.\w{2,5}$/.test(pathname)) {
    return NextResponse.next()
  }

  // ── Extract locale from URL prefix: /es/... or /pt/...
  const localeMatch = pathname.match(/^\/(es|pt)(\/.*)?$/)
  let locale: string | null = null
  let restPath = pathname // the path without locale prefix

  if (localeMatch) {
    locale = localeMatch[1]
    restPath = localeMatch[2] || "/"
    // For PT paths, translate back to canonical (ES filesystem) path
    if (locale === "pt") {
      restPath = toCanonicalPath(restPath)
    }
  }

  // ── No locale prefix → redirect to /{locale}/path
  if (!locale) {
    const cookieLocale = req.cookies.get(COOKIE_NAME)?.value
    const acceptLang = req.headers.get("accept-language") || ""
    const langs = acceptLang.split(",").map((l) => l.split(";")[0].trim().substring(0, 2))
    const detected = cookieLocale || langs.find((l) => LOCALES.includes(l)) || DEFAULT_LOCALE
    const res = NextResponse.redirect(new URL(`/${detected}${pathname === "/" ? "" : pathname}${search}`, req.url))
    res.cookies.set(COOKIE_NAME, detected, { path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "lax" })
    return res
  }

  // ── Set locale cookie
  const setCookie = (res: NextResponse) => {
    res.cookies.set(COOKIE_NAME, locale!, { path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "lax" })
    return res
  }

  // ── Auth: Redirect logged-in users away from auth pages
  if (isLoggedIn && publicAuthRoutes.some((r) => restPath.startsWith(r))) {
    const redirectParam = req.nextUrl.searchParams.get("redirect")
    const target = redirectParam || `/${locale}`
    return setCookie(NextResponse.redirect(new URL(target, req.url)))
  }

  // ── Auth: Protect /cuenta routes
  if (restPath.startsWith("/cuenta") && !isLoggedIn) {
    return setCookie(NextResponse.redirect(new URL(`/${locale}/login`, req.url)))
  }

  // ── Auth: Protect /dashboard routes — require admin role
  if (restPath.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return setCookie(NextResponse.redirect(new URL(`/${locale}/login`, req.url)))
    }
    if (role !== "admin") {
      return setCookie(NextResponse.redirect(new URL(`/${locale}`, req.url)))
    }
  }

  // ── Auth: Protect /support routes — require support or admin role
  if (restPath.startsWith("/support")) {
    if (!isLoggedIn) {
      return setCookie(NextResponse.redirect(new URL(`/${locale}/login`, req.url)))
    }
    if (role !== "support" && role !== "admin") {
      return setCookie(NextResponse.redirect(new URL(`/${locale}`, req.url)))
    }
  }

  // ── Rewrite: /es/productos → internal /productos, /pt/produtos → internal /productos
  const response = NextResponse.rewrite(new URL(restPath + search, req.url))
  return setCookie(response)
})

export const config = {
  matcher: [
    "/((?!api|uploads|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
