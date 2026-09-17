import { NextRequest, NextResponse } from "next/server"
import { createHash, randomInt } from "crypto"
import { db, initDb } from "@/lib/db"
import { otpCodes } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { isEmailAllowed } from "@/lib/email-validation"

const OTP_EXPIRY_MS = 10 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5

const sendLog = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const entry = sendLog.get(key)
  if (!entry || now > entry.resetAt) {
    sendLog.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  await initDb()

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  if (!isEmailAllowed(email)) {
    return NextResponse.json({ sent: true })
  }

  if (!checkRateLimit(email)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  // Invalidate previous unused codes for this email
  db.update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false)))
    .run()

  const code = randomInt(100000, 999999).toString()
  const codeHash = createHash("sha256").update(code).digest("hex")
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

  db.insert(otpCodes)
    .values({ email, codeHash, expiresAt })
    .run()

  // In dev/test without SMTP, log the code to console
  if (process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer")
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@xmrig-dashboard.local",
      to: email,
      subject: "Your XMRig Dashboard login code",
      text: `Your one-time passcode is: ${code}\n\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.`,
      html: `<p>Your one-time passcode is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`,
    })
  } else {
    console.log(`[OTP] Code for ${email}: ${code}`)
  }

  return NextResponse.json({ sent: true })
}
