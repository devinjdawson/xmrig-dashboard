"use client"

import { useEffect, useRef, useState } from "react"

interface RollingNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

function formatWithDecimals(n: number, decimals: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function RollingNumber({
  value,
  duration = 500,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
}: RollingNumberProps) {
  const [display, setDisplay] = useState(value)
  const ref = useRef({ from: value, target: value, raf: 0, start: 0 })

  useEffect(() => {
    if (value === ref.current.target) return
    cancelAnimationFrame(ref.current.raf)
    ref.current.from = display
    ref.current.target = value
    ref.current.start = performance.now()

    function tick(now: number) {
      const elapsed = now - ref.current.start
      const t = Math.min(1, elapsed / duration)
      // cubic ease-out — fast start, soft land like a gas pump
      const eased = 1 - Math.pow(1 - t, 3)
      const next = ref.current.from + (ref.current.target - ref.current.from) * eased
      setDisplay(next)
      if (t < 1) {
        ref.current.raf = requestAnimationFrame(tick)
      }
    }
    ref.current.raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(ref.current.raf)
    // display is intentionally omitted — we always capture the "current" value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span className={`tabular-nums inline-block ${className ?? ""}`}>
      {prefix}{formatWithDecimals(display, decimals)}{suffix}
    </span>
  )
}
