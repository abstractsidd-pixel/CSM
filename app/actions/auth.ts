"use server"

import { signInAs, signOut } from "@/lib/session"
import type { Role } from "@/lib/constants"
import { redirect } from "next/navigation"

export async function loginAction(role: Role, email: string, name: string) {
  await signInAs(role, email, name)
  return { ok: true }
}

export async function logoutAction() {
  await signOut()
  redirect("/")
}
