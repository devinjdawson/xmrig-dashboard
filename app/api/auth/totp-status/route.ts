import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    await initDb()

    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const user = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()

    if (!user) {
      // User doesn't exist yet (first login), no TOTP enabled
      return NextResponse.json({ enabled: false, configured: false })
    }

    return NextResponse.json({
      enabled: user.totpEnabled || false,
      configured: !!user.totpSecret
    })
  } catch (error) {
    console.error("TOTP status check failed:", error)
    // On error, assume no TOTP to allow login to proceed
    return NextResponse.json({ enabled: false, configured: false })
  }
}
