import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const publicAuthRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && publicAuthRoutes.some((r) => pathname.startsWith(r))) {
    const redirectParam = req.nextUrl.searchParams.get("redirect")
    const target = redirectParam || "/"
    return NextResponse.redirect(new URL(target, req.url))
  }

  // Protect /account routes
  if (pathname.startsWith("/account") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Protect /dashboard routes — require admin role
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protect /support routes — require support or admin role
  if (pathname.startsWith("/support")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (role !== "support" && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|uploads|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
