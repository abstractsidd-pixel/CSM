"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { staff, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sign, unsign } from "@/lib/session-crypto"
import type { Role } from "@/lib/constants"

const COOKIE = "cms_session"

export type Session = {
  role: Role
  email: string
  name: string
  userId?: number
  staffId?: number
  subdivision?: string | null
}

function isValidSession(data: unknown): data is Session {
  if (typeof data !== "object" || data === null) return false
  const obj = data as Record<string, unknown>
  if (typeof obj.role !== "string" || !["User", "JE", "AE", "EE", "Dean"].includes(obj.role)) return false
  if (typeof obj.email !== "string" || !obj.email.includes("@")) return false
  if (typeof obj.name !== "string") return false
  return true
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  if (!raw) return null
  try {
    const payload = await unsign(raw)
    if (!payload) return null
    const data = JSON.parse(payload)
    return isValidSession(data) ? data : null
  } catch {
    return null
  }
}

async function setSessionCookie(session: Session) {
  const store = await cookies()
  const signed = await sign(JSON.stringify(session))
  store.set(COOKIE, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function signInWithCredentials(userId: number, role: Role, email: string, name: string) {
  let staffId: number | undefined
  let subdivision: string | null | undefined

  if (role !== "User") {
    const rows = await db.select().from(staff).where(eq(staff.email, email)).limit(1)
    if (rows[0]) {
      staffId = rows[0].id
      subdivision = rows[0].subdivision
    }
  }

  const session: Session = { role, email, name, userId, staffId, subdivision }
  await setSessionCookie(session)
  return session
}

export async function signOut() {
  const store = await cookies()
  store.delete(COOKIE)
}
