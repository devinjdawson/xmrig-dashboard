export function parse<T = any>(raw: any): T | null {
  if (raw == null) return null
  if (typeof raw === "object") return raw as T
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return null
}
