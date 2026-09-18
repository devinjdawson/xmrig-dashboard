import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"
import { isEmailAllowed } from "@/lib/email-validation"

export async function GET() {
  await initDb()
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const currentUser = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const allUsers = db.select().from(users).all()
  
  return NextResponse.json(allUsers)
}

export async function POST(req: NextRequest) {
  await initDb()
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const currentUser = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { email, name, role } = body

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Check if email is allowed based on configured restrictions
  if (!isEmailAllowed(email)) {
    return NextResponse.json({ error: "Email domain not allowed" }, { status: 403 })
  }

  // Check if user already exists
  const existingUser = db.select().from(users).where(eq(users.email, email)).get()
  
  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 })
  }

  const userId = randomUUID()
  
  db.insert(users).values({
    id: userId,
    email,
    name: name || email.split("@")[0],
    role: role || "user",
  }).run()

  const newUser = db.select().from(users).where(eq(users.id, userId)).get()

  return NextResponse.json(newUser)
}
