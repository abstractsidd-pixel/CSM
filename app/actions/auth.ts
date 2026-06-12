"use server"

import { signInAs, signInWithCredentials, signOut } from "@/lib/session"
import type { Role } from "@/lib/constants"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function loginAction(role: Role, email: string, name: string) {
  await signInAs(role, email, name)
  return { ok: true }
}

export async function credentialLogin(email: string, password: string, role: Role) {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, role)))
    .limit(1)
  const user = rows[0]

  if (!user) {
    return { ok: false, error: "Invalid credentials for this role" }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { ok: false, error: "Invalid email or password" }
  }

  const session = await signInWithCredentials(user.id, role, user.email, user.name)

  if (role === "User") {
    return { ok: true, redirectTo: "/student" }
  }
  return { ok: true, redirectTo: "/admin" }
}

export async function logoutAction() {
  await signOut()
  redirect("/")
}
