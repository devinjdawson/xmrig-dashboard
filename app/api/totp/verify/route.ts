import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

// TOTP verification implementation
function verifyTOTP(secret: string, token: string, window = 1): boolean {
  const crypto = require("crypto")
  
  // Get current time step
  const timeStep = 30
  const currentTime = Math.floor(Date.now() / 1000 / timeStep)
  
  // Check tokens within the window
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i
    const timeBuffer = Buffer.alloc(8)
    timeBuffer.writeUInt32BE(0, 0)
    timeBuffer.writeUInt32BE(time, 4)
    
    const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"))
    hmac.update(timeBuffer)
    const hash = hmac.digest()
    
    const offset = hash[hash.length - 1] & 0xf
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000
    
    const expectedToken = code.toString().padStart(6, "0")
    
    if (token === expectedToken) {
      return true
    }
  }
  
  return false
}

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

  const body = await req.json()
  const { token } = body

  if (!token || typeof token !== "string" || token.length !== 6) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
  }

  if (!user.totpSecret) {
    return NextResponse.json({ error: "TOTP not initialized. Call /api/totp/setup first" }, { status: 400 })
  }

  // Verify the TOTP token
  const isValid = verifyTOTP(user.totpSecret, token)
  
  if (!isValid) {
    return NextResponse.json({ error: "Invalid TOTP code" }, { status: 400 })
  }

  // Enable TOTP for the user
  db.update(users)
    .set({ totpEnabled: true, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run()

  return NextResponse.json({ success: true, message: "TOTP enabled successfully" })
}
