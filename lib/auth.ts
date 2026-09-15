import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import GitLab from "next-auth/providers/gitlab"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"

const ALLOWED_EMAILS = (process.env.AUTH_ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  if (ALLOWED_EMAILS.length === 0) return true
  return ALLOWED_EMAILS.includes(email.toLowerCase())
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined
        if (!email || !isAllowed(email)) return null
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
