/**
 * Edge-compatible session encryption + signing using Web Crypto API.
 * Encrypts payload with AES-GCM, then signs with HMAC-SHA256.
 * Works in both Edge Runtime (middleware) and Node.js (server actions).
 */

const SECRET = process.env.SESSION_SECRET
if (!SECRET) throw new Error("SESSION_SECRET env var is required")

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
  return keyMaterial
}

async function getAesKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("cms-session-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64url(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function encrypt(plaintext: string): Promise<string> {
  const aesKey = await getAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded)
  return `${base64url(iv.buffer)}.${base64url(ciphertext)}`
}

async function decrypt(encrypted: string): Promise<string | null> {
  const idx = encrypted.indexOf(".")
  if (idx === -1) return null
  const ivB64 = encrypted.slice(0, idx)
  const ctB64 = encrypted.slice(idx + 1)
  try {
    const aesKey = await getAesKey()
    const iv = fromBase64url(ivB64)
    const ct = fromBase64url(ctB64)
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct)
    return new TextDecoder().decode(plainBuf)
  } catch {
    return null
  }
}

export async function sign(payload: string): Promise<string> {
  const key = await getCryptoKey()
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return `${payload}.${base64url(sig)}`
}

export async function unsign(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf(".")
  if (idx === -1) return null
  const payload = signed.slice(0, idx)
  const sigB64 = signed.slice(idx + 1)

  const key = await getCryptoKey()
  const sigBuf = fromBase64url(sigB64)
  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(payload))
  return valid ? payload : null
}

export async function encryptSession(data: object): Promise<string> {
  const json = JSON.stringify(data)
  const encrypted = await encrypt(json)
  return sign(encrypted)
}

export async function decryptSession(signed: string): Promise<object | null> {
  const encrypted = await unsign(signed)
  if (!encrypted) return null
  const json = await decrypt(encrypted)
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}
