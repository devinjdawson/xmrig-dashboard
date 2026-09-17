import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import GitLab from "next-auth/providers/gitlab"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"
import { getOrCreateAuthSecret } from "./auth-secrets"
import { isEmailAllowed } from "./email-validation"

// Resolve the canonical app URL. Auth.js v5 reads AUTH_URL to build callbacks/redirects.
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

export function isAllowed(email: string | null | undefined): boolean {
  return isEmailAllowed(email)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getOrCreateAuthSecret(),
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
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
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined
        const code = credentials?.code as string | undefined
        if (!email || !code || !isAllowed(email)) return null
        const { verifyOtp } = await import("./otp-verify")
        const valid = await verifyOtp(email, code)
        if (!valid) return null
        return { id: email, email, name: email.split("@")[0] }
      },
    }),
  ],
  callbacks: {
    authorized: async ({ auth: session }) => {
      return !!session?.user?.email && isAllowed(session.user.email)
    },
    signIn: async ({ user }) => {
      return isAllowed(user.email)
    },
  },
  pages: {
    signIn: "/login",
  },
})
