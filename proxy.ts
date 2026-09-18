import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig, AUTH_ENABLED, isAllowed } from "./lib/auth.config"

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ["/login", "/api/auth"]

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl

  // Expose the pathname to server components so the root layout can enforce
  // DB-backed session checks (revocation) per route.
  const headers = new Headers(req.headers)
  headers.set("x-pathname", pathname)
  const next = NextResponse.next({ request: { headers } })

  if (!AUTH_ENABLED) return next
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return next
  if (pathname.startsWith("/_next")) return next

  const email = req.auth?.user?.email
  if (email && isAllowed(email)) return next

  const loginUrl = new URL("/login", req.url)
  loginUrl.searchParams.set("callbackUrl", pathname)
  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
