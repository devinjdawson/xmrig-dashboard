import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { db, initDb } from "@/lib/db"
import { otpCodes } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { isAllowed } from "@/lib/auth"
import { signIn } from "@/lib/auth"

export async function POST(req: NextRequest) {
  await initDb()

  let body: { email?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const code = body.code?.trim()

  if (!email || !code) {
    return NextResponse.json({ valid: false, error: "Email and code required" }, { status: 400 })
  }

  if (!isAllowed(email)) {
    return NextResponse.json({ valid: false, error: "Access denied" }, { status: 403 })
  }

  const codeHash = createHash("sha256").update(code).digest("hex")

  const record = db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.codeHash, codeHash),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1)
    .get()

  if (!record) {
    return NextResponse.json({ valid: false, error: "Invalid or expired code" }, { status: 401 })
  }

  // Don't mark as used here - let signIn's authorize function consume it
  return NextResponse.json({ valid: true, email })
}
