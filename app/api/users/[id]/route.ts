import { NextRequest, NextResponse } from "next/server"
import { db, initDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb()
  const { id } = await params
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, role } = body

  const existingUser = db.select().from(users).where(eq(users.id, id)).get()
  
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const updates: any = { updatedAt: new Date() }
  if (name !== undefined) updates.name = name
  if (role !== undefined) updates.role = role

  db.update(users).set(updates).where(eq(users.id, id)).run()

  const updatedUser = db.select().from(users).where(eq(users.id, id)).get()

  return NextResponse.json(updatedUser)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb()
  const { id } = await params
  
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = db.select().from(users).where(eq(users.email, session.user.email)).get()
  
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const existingUser = db.select().from(users).where(eq(users.id, id)).get()
  
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Prevent deleting yourself
  if (existingUser.email === session.user.email) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  db.delete(users).where(eq(users.id, id)).run()

  return NextResponse.json({ success: true })
}
