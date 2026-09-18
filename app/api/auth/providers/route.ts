import { NextResponse } from "next/server"

function oauthDescriptor(id: string, name: string) {
  return {
    id,
    name,
    type: "oauth",
    signinUrl: `/api/auth/signin/${id}`,
    callbackUrl: `/api/auth/callback/${id}`,
  }
}

export async function GET() {
  return NextResponse.json({
    // OTP (passwordless) credentials provider. Required for client-side
    // signIn("otp") to resolve to POST /api/auth/callback/otp.
    otp: {
      id: "otp",
      name: "OTP",
      type: "credentials",
      signinUrl: "/api/auth/callback/otp",
      callbackUrl: "/api/auth/callback/otp",
    },
    github:
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
        ? oauthDescriptor("github", "GitHub")
        : null,
    gitlab:
      process.env.AUTH_GITLAB_ID && process.env.AUTH_GITLAB_SECRET
        ? oauthDescriptor("gitlab", "GitLab")
        : null,
    google:
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
        ? oauthDescriptor("google", "Google")
        : null,
    microsoft:
      process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
        ? oauthDescriptor("microsoft-entra-id", "Microsoft")
        : null,
  })
}
