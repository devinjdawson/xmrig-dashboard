import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/login", "/api/auth"]
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET must be set")
  return secret
}

function getBaseUrl(fallback: string): string {
  const url =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL
  return url && /^https?:\/\//.test(url) ? url : fallback
}

export async function middleware(req: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next()

  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next()
  }

  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value

  const base = getBaseUrl(req.url)

  if (!token) {
    return NextResponse.redirect(new URL("/login", base))
  }

  try {
    const secret = new TextEncoder().encode(getAuthSecret())
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", base))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
