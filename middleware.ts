import NextAuth from "next-auth"
import { authConfig } from "./lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // The `authorized` callback in authConfig decides allow/deny and handles
  // redirecting unauthenticated users to /login with a callbackUrl.
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
