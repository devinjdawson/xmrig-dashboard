import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq, lt } from "drizzle-orm"
import { randomUUID } from "crypto"
import { authConfig, isAllowed, SESSION_MAX_AGE_SECONDS } from "./auth.config"
import { isAdminEmail } from "./email-validation"
import { db, initDb } from "./db"
import {
  users as usersTable,
  accounts as accountsTable,
  sessions as sessionsTable,
  verificationTokens,
} from "./db/schema"

function deviceHintFrom(headers: Headers): string | null {
  const ua = headers.get("user-agent")
  if (!ua) return null
  return ua.slice(0, 200)
}

function ensureUserByCredentials(email: string, name?: string | null) {
  const normalized = email.toLowerCase()
  let user = db.select().from(usersTable).where(eq(usersTable.email, normalized)).get()
  if (!user) {
    user = db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        email: normalized,
        name: name || normalized.split("@")[0],
      })
      .returning()
      .get()
  }
  return user
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable,
    accountsTable,
    sessionsTable,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined
        const code = credentials?.code as string | undefined
        if (!email || !code || !isAllowed(email)) return null
        const { verifyOtp } = await import("./otp-verify")
        const valid = await verifyOtp(email, code)
        if (!valid) return null
        return {
          id: email.toLowerCase(),
          email: email.toLowerCase(),
          name: email.split("@")[0],
          deviceHint: deviceHintFrom(new Headers(request.headers)),
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user && account && token) {
        await initDb()
        const email = user.email?.toLowerCase()
        if (!email) return token

        const userRow =
          db.select().from(usersTable).where(eq(usersTable.email, email)).get() ??
          ensureUserByCredentials(email, user.name)

        if (isAdminEmail(email) && userRow.role !== "admin") {
          userRow.role = "admin"
          db.update(usersTable)
            .set({ role: "admin", updatedAt: new Date() })
            .where(eq(usersTable.id, userRow.id))
            .run()
        }

        token.sub = userRow.id

        db.delete(sessionsTable)
          .where(lt(sessionsTable.expires, new Date()))
          .run()

        const sessionId = randomUUID()
        db.insert(sessionsTable)
          .values({
            sessionToken: sessionId,
            userId: userRow.id,
            expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
            deviceHint: (user as any).deviceHint ?? null,
          })
          .run()

        token.sessionId = sessionId
      }
      return token
    },
    async session({ session, token }) {
      const t = token as { sub?: string; email?: string; sessionId?: string }
      if (session.user) {
        if (t.sub) session.user.id = t.sub
        if (t.sessionId) session.user.sessionId = t.sessionId
        if (t.email) {
          const userRow = db
            .select({ role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.email, t.email.toLowerCase()))
            .get()
          if (userRow) session.user.role = userRow.role
        }
      }
      return session
    },
  },
  events: {
    async signOut(params: any) {
      const sessionId = params?.token?.sessionId
      if (!sessionId) return
      await initDb()
      db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, sessionId)).run()
    },
  },
})

export { isAllowed }
