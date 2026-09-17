import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  await initDb()
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Generate a new TOTP secret
  const secret = randomBytes(20).toString("hex")
  
  // Store the secret but don't enable it yet
  db.update(users)
    .set({ totpSecret: secret, totpEnabled: false, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run()

  // Generate the QR code URL
  const issuer = "XMRig Dashboard"
  const accountName = user.email
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

  return NextResponse.json({
    secret,
    otpauthUrl,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
  })
}
