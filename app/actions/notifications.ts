"use server"

import { db } from "@/lib/db"
import { notifications, staff } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

export async function createNotification({
  recipientEmail,
  type,
  title,
  message,
  complaintId,
  docketNumber,
  data,
}: {
  recipientEmail: string
  type: string
  title: string
  message: string
  complaintId?: number
  docketNumber?: string
  data?: Record<string, string>
}) {
  await db.insert(notifications).values({
    recipientEmail,
    type,
    title,
    message,
    complaintId,
    docketNumber,
  })

  const vars = {
    recipientEmail,
    docketNumber: docketNumber || "",
    ...data,
  }
  sendEmail(type, recipientEmail, vars).catch(() => {})
}

// ponytail: thin helper for the repeated "query je by jeId, notify" pattern
export async function notifyJeStaff(
  jeId: number | null | undefined,
  notification: { type: string; title: string; message: string; complaintId: number; docketNumber: string },
  data?: Record<string, string>,
) {
  if (!jeId) return
  const rows = await db.select().from(staff).where(eq(staff.id, jeId)).limit(1)
  if (rows[0]) {
    await createNotification({ ...notification, recipientEmail: rows[0].email, data })
  }
}
