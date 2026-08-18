"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { staff } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { Role } from "@/lib/constants"
import type { Session } from "@/lib/types"

export async function getSession(): Promise<Session | null> {
  const nextAuthSession = await getServerSession(authOptions)
  if (!nextAuthSession?.user?.email) return null

  const email = nextAuthSession.user.email
  const name = nextAuthSession.user.name || ""
  const role = (nextAuthSession as Record<string, unknown>).role as Role | undefined
    ?? (nextAuthSession.user as Record<string, unknown>).role as Role | undefined

  if (!role) return null

  let staffId: number | undefined
  let subdivision: string | null | undefined

  if (role !== "User") {
    const rows = await db.select().from(staff).where(eq(staff.email, email)).limit(1)
    if (rows[0]) {
      staffId = rows[0].id
      subdivision = rows[0].subdivision
    }
  }

  return { role, email, name, staffId, subdivision }
}
