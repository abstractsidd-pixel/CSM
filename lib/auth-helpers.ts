import { getSession } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { isAdminRole } from "@/lib/constants"

const MUTATION_LIMIT = 30
const MUTATION_WINDOW_MS = 60 * 1000

export async function checkMutationLimit(): Promise<string | null> {
  const session = await getSession()
  const key = `mut:${session?.email || "anonymous"}`
  const { allowed, retryAfterMs } = checkRateLimit(key, MUTATION_LIMIT, MUTATION_WINDOW_MS)
  if (!allowed) {
    return `Too many requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`
  }
  return null
}

export function requireAdmin(): Promise<string | null> {
  return getSession().then((s) => {
    if (!s || !isAdminRole(s.role)) return "Unauthorized."
    return null
  })
}

export function requireEeOrDean(): Promise<string | null> {
  return getSession().then((s) => {
    if (!s) return "Unauthorized."
    if (s.role !== "EE" && s.role !== "Dean") return "Requires EE or Dean role."
    return null
  })
}
