import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const API_DIR = process.env.P2POOL_API_DIR || ""

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!API_DIR) {
    return NextResponse.json(
      { error: "P2POOL_API_DIR not configured" },
      { status: 500 }
    )
  }

  const { path: segments } = await params
  const requestedPath = segments.join("/")

  const safePath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, "")
  const fullPath = path.join(API_DIR, safePath)

  if (!fullPath.startsWith(path.resolve(API_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 })
  }

  try {
    const content = await readFile(fullPath, "utf-8")
    const json = JSON.parse(content)
    return NextResponse.json(json)
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 500 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
