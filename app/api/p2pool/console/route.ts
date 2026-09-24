import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-auth"
import { consoleStatus, sendConsoleCommand } from "@/lib/p2pool-console"

export async function GET() {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  return NextResponse.json(await consoleStatus())
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const body = await req.json().catch(() => null)
  const command = typeof body?.command === "string" ? body.command : ""

  try {
    const result = await sendConsoleCommand(command)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    const message = e?.message || String(e)
    const isValidationError = !message.includes("Console") && !message.includes("P2Pool")
    return NextResponse.json({ ok: false, error: message }, { status: isValidationError ? 400 : 502 })
  }
}
