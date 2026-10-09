"use client"

import * as React from "react"
import { cn } from "cn"
import { applyMask, type MaskKind } from "@/lib/mask"

const STORAGE_KEY = "xmrig-privacy-obfuscate"

interface PrivacyState {
  obfuscate: boolean
  setObfuscate: (v: boolean) => void
}

const PrivacyContext = React.createContext<PrivacyState>({
  obfuscate: true,
  setObfuscate: () => {},
})

export function usePrivacy(): PrivacyState {
  return React.useContext(PrivacyContext)
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [obfuscate, setObfuscateState] = React.useState(true)

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v != null) setObfuscateState(v === "1")
    } catch {}
  }, [])

  const setObfuscate = React.useCallback((v: boolean) => {
    setObfuscateState(v)
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0")
    } catch {}
  }, [])

  return (
    <PrivacyContext.Provider value={{ obfuscate, setObfuscate }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function MaskedText({
  value,
  kind,
  className,
  emptyLabel = "—",
}: {
  value: string | null | undefined
  kind: MaskKind
  className?: string
  emptyLabel?: string
}) {
  const { obfuscate } = usePrivacy()
  const [revealed, setRevealed] = React.useState(false)
  const raw = value ?? ""

  if (!raw) return <span className={className}>{emptyLabel}</span>

  const masked = obfuscate && !revealed
  return (
    <span
      className={cn(className, masked && "cursor-pointer select-none")}
      onClick={masked ? () => setRevealed(true) : undefined}
      title={masked ? "Click to reveal" : undefined}
    >
      {masked ? applyMask(raw, kind) : raw}
    </span>
  )
}
