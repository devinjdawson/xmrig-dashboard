import { redirect } from "next/navigation"
import { AUTH_ENABLED } from "@/lib/auth.config"
import { getAuthContext } from "@/lib/api-auth"
import { AdminClient } from "./admin-client"

export default async function AdminPage() {
  if (!AUTH_ENABLED) {
    redirect("/")
  }

  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login?callbackUrl=%2Fadmin")
  }
  if (ctx.user.role !== "admin") {
    redirect("/")
  }

  return <AdminClient />
}
