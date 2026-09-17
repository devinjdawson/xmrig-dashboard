import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  await initDb()
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({
    enabled: user.totpEnabled,
    configured: !!user.totpSecret
  })
}

export async function DELETE(req: NextRequest) {
  await initDb()
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Disable TOTP
  db.update(users)
    .set({ totpEnabled: false, totpSecret: null, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run()

  return NextResponse.json({ success: true, message: "TOTP disabled successfully" })
}
