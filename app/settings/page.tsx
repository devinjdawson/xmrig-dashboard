"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ShieldCheck, ShieldOff, MonitorSmartphone, Trash2 } from "lucide-react"

interface SessionRow {
  id: string
  createdAt: string
  expires: string
  deviceHint: string | null
  current: boolean
}

export default function SettingsPage() {
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpConfigured, setTotpConfigured] = useState(false)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // TOTP setup state
  const [showSetup, setShowSetup] = useState(false)
  const [secret, setSecret] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [verifyCode, setVerifyCode] = useState("")

  useEffect(() => {
    loadTotpStatus()
    loadSessions()
  }, [])

  async function loadTotpStatus() {
    try {
      const res = await fetch("/api/totp")
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to load TOTP status")
        return
      }
      const data = await res.json()
      setTotpEnabled(data.enabled)
      setTotpConfigured(data.configured)
      setError(null)
    } catch (err) {
      setError("Failed to load TOTP status")
    } finally {
      setLoading(false)
    }
  }

  async function handleSetupTotp() {
    try {
      const res = await fetch("/api/totp/setup", {
        method: "POST",
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to setup TOTP")
        return
      }
      
      const data = await res.json()
      setSecret(data.secret)
      setQrCodeUrl(data.qrCodeUrl)
      setShowSetup(true)
      setError(null)
    } catch (err) {
      setError("Failed to setup TOTP")
    }
  }

  async function handleVerifyTotp() {
    try {
      const res = await fetch("/api/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyCode }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Invalid TOTP code")
        return
      }
      
      setSuccess("Two-factor authentication enabled successfully!")
      setShowSetup(false)
      setVerifyCode("")
      loadTotpStatus()
    } catch (err) {
      setError("Failed to verify TOTP")
    }
  }

  async function handleDisableTotp() {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) return
    
    try {
      const res = await fetch("/api/totp", {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to disable TOTP")
        return
      }
      
      setSuccess("Two-factor authentication disabled successfully!")
      loadTotpStatus()
    } catch (err) {
      setError("Failed to disable TOTP")
    }
  }

  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions")
      if (!res.ok) return
      setSessions(await res.json())
    } catch {
      // Non-fatal: sessions are only relevant when auth is enabled
    }
  }

  async function handleRevokeSession(id: string, current: boolean) {
    const message = current
      ? "Sign out of this device? You will be redirected to login."
      : "Revoke this session? That device will be signed out."
    if (!confirm(message)) return

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to revoke session")
        return
      }
      if (current) {
        window.location.href = "/"
        return
      }
      loadSessions()
    } catch {
      setError("Failed to revoke session")
    }
  }

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {totpEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Authenticator App</div>
              <div className="text-sm text-muted-foreground">
                {totpEnabled ? (
                  <span className="text-green-500">Enabled</span>
                ) : (
                  "Not configured"
                )}
              </div>
            </div>
            {totpEnabled ? (
              <Button variant="destructive" onClick={handleDisableTotp}>
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleSetupTotp}>
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            )}
          </div>

          {showSetup && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label>Scan QR Code</Label>
                <div className="mt-2 flex justify-center">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="border rounded" />
                </div>
              </div>
              
              <div>
                <Label>Or enter this secret manually</Label>
                <div className="mt-2 p-2 bg-background rounded font-mono text-sm break-all">
                  {secret}
                </div>
              </div>

              <div>
                <Label htmlFor="verify-code">Enter verification code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-2 text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSetup(false)
                    setVerifyCode("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyTotp}
                  disabled={verifyCode.length !== 6}
                >
                  Verify and Enable
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Scan the QR code or enter the secret manually</li>
              <li>Enter the 6-digit code from the app to verify</li>
              <li>After enabling, you'll need to enter both email code and TOTP code when logging in</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5" />
              <CardTitle>Active Sessions</CardTitle>
            </div>
            <CardDescription>
              Devices currently signed in to your account. Revoke any session you do not recognize.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {session.current ? "This device" : formatDate(session.createdAt)}
                      </span>
                      {session.current && <Badge variant="secondary">Current</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.deviceHint || "No device details recorded"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Signed in {formatDate(session.createdAt)}
                    </div>
                  </div>
                  <Button
                    variant={session.current ? "outline" : "destructive"}
                    size="icon"
                    onClick={() => handleRevokeSession(session.id, session.current)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
