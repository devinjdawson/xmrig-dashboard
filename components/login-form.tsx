"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { GalleryVerticalEndIcon } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await signIn("credentials", { email, redirect: false })
      if (result?.error) {
        setError("Access denied. Your email is not on the allowlist.")
      } else {
        window.location.href = "/"
      }
    } catch {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleEmailLogin}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
            <h1 className="text-xl font-bold">XMRig Dashboard</h1>
            <FieldDescription>Sign in to access the dashboard</FieldDescription>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </Field>
          <Field>
            <Button type="submit" disabled={loading || !email}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Field>
          <FieldSeparator>Or continue with</FieldSeparator>
          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button" onClick={() => signIn("github")} disabled={loading}>
              GitHub
            </Button>
            <Button variant="outline" type="button" onClick={() => signIn("google")} disabled={loading}>
              Google
            </Button>
            <Button variant="outline" type="button" onClick={() => signIn("gitlab")} disabled={loading}>
              GitLab
            </Button>
            <Button variant="outline" type="button" onClick={() => signIn("microsoft-entra-id")} disabled={loading}>
              Microsoft
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
