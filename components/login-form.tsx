"use client"

import { signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { GalleryVerticalEndIcon } from "lucide-react"

interface Providers {
  github: boolean
  gitlab: boolean
  google: boolean
  microsoft: boolean
}

export function LoginForm() {
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<Providers | null>(null)

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => setProviders({ github: false, gitlab: false, google: false, microsoft: false }))
  }, [])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send code")
      } else {
        setStep("code")
      }
    } catch {
      setError("Failed to send code")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid or expired code")
        return
      }
      const result = await signIn("otp", { email, code, redirect: false, callbackUrl: "/" })
      if (result?.error) {
        setError("Session creation failed")
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError("Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const hasOAuth = providers && Object.values(providers).some(Boolean)

  return (
    <div className="flex flex-col gap-6">
      {step === "email" ? (
        <form onSubmit={handleSendCode}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <h1 className="text-xl font-bold">XMRig Dashboard</h1>
              <FieldDescription>Enter your email to receive a login code</FieldDescription>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
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
                autoFocus
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || !email}>
                {loading ? "Sending..." : "Send login code"}
              </Button>
            </Field>
            {hasOAuth && (
              <>
                <FieldSeparator>Or continue with</FieldSeparator>
                <Field className="grid gap-4 sm:grid-cols-2">
                  {providers?.github && (
                    <Button variant="outline" type="button" onClick={() => signIn("github")} disabled={loading}>GitHub</Button>
                  )}
                  {providers?.google && (
                    <Button variant="outline" type="button" onClick={() => signIn("google")} disabled={loading}>Google</Button>
                  )}
                  {providers?.gitlab && (
                    <Button variant="outline" type="button" onClick={() => signIn("gitlab")} disabled={loading}>GitLab</Button>
                  )}
                  {providers?.microsoft && (
                    <Button variant="outline" type="button" onClick={() => signIn("microsoft-entra-id")} disabled={loading}>Microsoft</Button>
                  )}
                </Field>
              </>
            )}
          </FieldGroup>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <h1 className="text-xl font-bold">Enter your code</h1>
              <FieldDescription>
                Code sent to <span className="font-medium text-foreground">{email}</span>
              </FieldDescription>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <Field>
              <FieldLabel htmlFor="code">One-time passcode</FieldLabel>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? "Verifying..." : "Sign in"}
              </Button>
            </Field>
            <Field>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setStep("email"); setCode(""); setError(null) }}
                disabled={loading}
              >
                Use a different email
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}
