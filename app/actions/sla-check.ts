"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { getBreachedComplaints, getStaffByRole } from "@/lib/queries"

export async function checkAndNotifySlaBreaches() {
  const breached = await getBreachedComplaints()
  if (breached.length === 0) return

  const aeStaff = await getStaffByRole("AE")
  const eeStaff = await getStaffByRole("EE")
  const deanStaff = await getStaffByRole("Dean")
  const recipients = [...aeStaff, ...eeStaff, ...deanStaff]
  if (recipients.length === 0) return

  const complaintIds = breached.map((c) => c.id)
  const recipientEmails = recipients.map((s) => s.email)

  const existing = await db
    .select({ complaintId: notifications.complaintId, recipientEmail: notifications.recipientEmail })
    .from(notifications)
    .where(
      and(
        eq(notifications.type, "SLA_BREACH"),
        inArray(notifications.complaintId, complaintIds),
        inArray(notifications.recipientEmail, recipientEmails)
      )
    )

  const existingSet = new Set(existing.map((e) => `${e.complaintId}:${e.recipientEmail}`))

  const toInsert = []
  for (const complaint of breached) {
    const hoursOverdue = Math.round(
      (Date.now() - new Date(complaint.dueAt!).getTime()) / (1000 * 60 * 60)
    )
    for (const staff of recipients) {
      if (!existingSet.has(`${complaint.id}:${staff.email}`)) {
        toInsert.push({
          recipientEmail: staff.email,
          type: "SLA_BREACH",
          title: "SLA Breach Alert",
          message: `Complaint ${complaint.docketNumber} has breached its SLA deadline by ${hoursOverdue} hours. Status: ${complaint.status}.`,
          complaintId: complaint.id,
          docketNumber: complaint.docketNumber,
        })
      }
    }
  }

  if (toInsert.length > 0) {
    await db.insert(notifications).values(toInsert)
  }
}
