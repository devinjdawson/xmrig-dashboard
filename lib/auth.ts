import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig, isAllowed } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined
        const code = credentials?.code as string | undefined
        if (!email || !code || !isAllowed(email)) return null
        const { verifyOtp } = await import("./otp-verify")
        const valid = await verifyOtp(email, code)
        if (!valid) return null
        return { id: email, email, name: email.split("@")[0] }
      },
    }),
  ],
})

export { isAllowed }
