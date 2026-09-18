import { auth } from "@/lib/auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { sessions as sessionsTable, users as usersTable } from "@/lib/db/schema"
import { eq, and, gt, lt } from "drizzle-orm"
import { isEmailAllowed } from "@/lib/email-validation"
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth.config"

export interface AuthContext {
  session: Session
  user: typeof usersTable.$inferSelect
  dbSession: typeof sessionsTable.$inferSelect
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth()
  const email = session?.user?.email
  const sessionId = session?.user?.sessionId
  if (!email || !sessionId) return null
  if (!isEmailAllowed(email)) return null

  await initDb()

  const dbSession = db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.sessionToken, sessionId), gt(sessionsTable.expires, new Date())))
    .get()
  if (!dbSession) return null

  const user = db.select().from(usersTable).where(eq(usersTable.id, dbSession.userId)).get()
  if (!user) {
    db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, sessionId)).run()
    return null
  }

  // Sliding expiry: refresh once we are past half the max age
  const remainingMs = new Date(dbSession.expires).getTime() - Date.now()
  if (remainingMs < (SESSION_MAX_AGE_SECONDS * 1000) / 2) {
    db.update(sessionsTable)
      .set({ expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000) })
      .where(eq(sessionsTable.sessionToken, sessionId))
      .run()
  }

  db.delete(sessionsTable).where(lt(sessionsTable.expires, new Date())).run()

  return { session, user, dbSession }
}

export async function requireAuth(): Promise<NextResponse | null> {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const ctx = await getAuthContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (ctx.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}
