/**
 * Edge-compatible session signing using Web Crypto API.
 * Works in both Edge Runtime (middleware) and Node.js (server actions).
 */

const SECRET = process.env.SESSION_SECRET
if (!SECRET) throw new Error("SESSION_SECRET env var is required")

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function sign(payload: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return `${payload}.${base64url(sig)}`
}

export async function unsign(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf(".")
  if (idx === -1) return null
  const payload = signed.slice(0, idx)
  const sigB64 = signed.slice(idx + 1)

  const key = await getKey()
  const sigBuf = Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  )
  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(payload))
  return valid ? payload : null
}
