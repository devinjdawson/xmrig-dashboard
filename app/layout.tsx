import { Geist, Geist_Mono } from "next/font/google"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { AUTH_ENABLED } from "@/lib/auth.config"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (AUTH_ENABLED) {
    const headerList = await headers()
    const pathname = headerList.get("x-pathname") ?? "/"
    const isPublic =
      pathname.startsWith("/login") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next")
    if (!isPublic) {
      const { getAuthContext } = await import("@/lib/api-auth")
      const ctx = await getAuthContext()
      if (!ctx) {
        redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      }
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
