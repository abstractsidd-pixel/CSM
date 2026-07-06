import { headers } from "next/headers"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetTime - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim())
    // Take rightmost non-local entry — last added by trusted proxy = original client
    for (let i = parts.length - 1; i >= 0; i--) {
      const ip = parts[i]
      if (ip && !ip.startsWith("127.") && !ip.startsWith("::1") && ip !== "unknown") {
        return ip
      }
    }
  }
  const real = h.get("x-real-ip")
  if (real && !real.startsWith("127.") && !real.startsWith("::1") && real !== "unknown") {
    return real.trim()
  }
  return "127.0.0.1"
}
