"use server"

import { redirect } from "next/navigation"
import { logActivity } from "@/lib/audit-log"
import { getSession } from "@/lib/session"

export async function logoutAction() {
  const session = await getSession()
  await logActivity(session?.email || "unknown", session?.role || "unknown", "LOGOUT", "User logged out")
  redirect("/api/auth/signout?csrf=true&callbackUrl=/")
}
