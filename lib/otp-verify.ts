import { createHash } from "crypto"

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const { db, initDb } = await import("@/lib/db")
  const { otpCodes } = await import("@/lib/db/schema")
  const { eq, and, gt } = await import("drizzle-orm")

  await initDb()
  const codeHash = createHash("sha256").update(code).digest("hex")

  const record = db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email.toLowerCase()),
        eq(otpCodes.codeHash, codeHash),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1)
    .get()

  if (!record) return false

  db.update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, record.id))
    .run()

  return true
}
