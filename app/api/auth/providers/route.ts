import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    github: !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    gitlab: !!(process.env.AUTH_GITLAB_ID && process.env.AUTH_GITLAB_SECRET),
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    microsoft: !!(
      process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
    ),
  })
}
