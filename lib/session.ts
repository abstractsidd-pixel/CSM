"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { staff, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export async function signInAs(role: Role, email: string, name: string) {
  let staffId: number | undefined
  let subdivision: string | null | undefined

  if (role !== "User") {
    const rows = await db.select().from(staff).where(eq(staff.email, email)).limit(1)
    if (rows[0]) {
      staffId = rows[0].id
      subdivision = rows[0].subdivision
    }
  }

  const session: Session = { role, email, name, staffId, subdivision }
  const store = await cookies()
  store.set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return session
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
  const store = await cookies()
  store.set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return session
}

export async function signOut() {
  const store = await cookies()
  store.delete(COOKIE)
}
