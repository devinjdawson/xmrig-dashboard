// Shared email validation utilities

const ALLOWED_EMAILS = (process.env.AUTH_ALLOWED_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const ALLOWED_DOMAINS = (process.env.AUTH_ALLOWED_DOMAINS || "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  
  const normalizedEmail = email.toLowerCase()
  
  // If no restrictions configured, allow all
  if (ALLOWED_EMAILS.length === 0 && ALLOWED_DOMAINS.length === 0) {
    return true
  }
  
  // Check if exact email is allowed
  if (ALLOWED_EMAILS.includes(normalizedEmail)) {
    return true
  }
  
  // Check if domain is allowed
  const domain = normalizedEmail.split("@")[1]
  if (domain && ALLOWED_DOMAINS.includes(domain)) {
    return true
  }
  
  return false
}

export function getAllowedEmails(): string[] {
  return ALLOWED_EMAILS
}

export function getAllowedDomains(): string[] {
  return ALLOWED_DOMAINS
}
