"use server"

import { signInWithCredentials, signOut, getSession } from "@/lib/session"
import type { Role } from "@/lib/constants"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { logActivity } from "@/lib/audit-log"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const LOGIN_RATE_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function credentialLogin(email: string, password: string, role: Role) {
  const ip = await getClientIp()
  const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS)
  if (!allowed) {
    const seconds = Math.ceil(retryAfterMs / 1000)
    return { ok: false, error: `Too many login attempts. Please try again in ${seconds} seconds.` }
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  const user = rows[0]

  if (!user) {
    await logActivity(email, role, "LOGIN_FAILED", "Invalid credentials")
    return { ok: false, error: "Invalid email or password." }
  }

  if (user.role !== role) {
    await logActivity(email, role, "LOGIN_FAILED", "Role mismatch")
    return { ok: false, error: "Invalid email or password." }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    await logActivity(email, role, "LOGIN_FAILED", "Invalid credentials")
    return { ok: false, error: "Invalid email or password." }
  }

  const session = await signInWithCredentials(user.id, role, user.email, user.name)
  await logActivity(user.email, role, "LOGIN", "Successful credential-based login")

  if (role === "User") {
    return { ok: true, redirectTo: "/student" }
  }
  return { ok: true, redirectTo: "/admin" }
}

export async function logoutAction() {
  const session = await getSession()
  await logActivity(session?.email || "unknown", session?.role || "unknown", "LOGOUT", "User logged out")
  await signOut()
  redirect("/")
}
