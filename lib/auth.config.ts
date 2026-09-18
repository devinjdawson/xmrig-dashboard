import GitHub from "next-auth/providers/github"
import GitLab from "next-auth/providers/gitlab"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import type { NextAuthConfig } from "next-auth"
import { isEmailAllowed } from "./email-validation"

// Resolve the canonical app URL. Auth.js reads AUTH_URL to build callbacks/redirects.
// Support common aliases so existing setups keep working.
if (!process.env.AUTH_URL) {
  const alias =
    process.env.NEXTAUTH_URL ||
    process.env.SITE_URL ||
    process.env.PUBLIC_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL
  if (alias) process.env.AUTH_URL = alias
}

export const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60
const PUBLIC_PATHS = ["/login", "/api/auth"]

export function isAllowed(email: string | null | undefined): boolean {
  return isEmailAllowed(email)
}

// NOTE: This config must stay edge-safe (no DB / native module imports) because the
// middleware uses it in the Edge runtime. The OTP Credentials provider lives in
// auth.ts (Node runtime) so it never gets bundled into the Edge middleware.
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  trustHost: true,
  providers: [
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })]
      : []),
    ...(process.env.AUTH_GITLAB_ID && process.env.AUTH_GITLAB_SECRET
      ? [GitLab({ clientId: process.env.AUTH_GITLAB_ID, clientSecret: process.env.AUTH_GITLAB_SECRET })]
      : []),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
      : []),
    ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET && process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
      ? [MicrosoftEntraID({
          clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
        })]
      : []),
  ],
  callbacks: {
    authorized({ auth, request }) {
      if (!AUTH_ENABLED) return true
      const { pathname } = request.nextUrl
      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true
      if (pathname.startsWith("/_next")) return true
      return Boolean(auth?.user?.email && isAllowed(auth.user.email))
    },
    signIn({ user }) {
      return isAllowed(user?.email)
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
