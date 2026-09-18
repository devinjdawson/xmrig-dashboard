import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      sessionId?: string
      role?: string
      deviceHint?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    deviceHint?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionId?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    sessionId?: string
  }
}
