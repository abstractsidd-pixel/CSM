"use server"

import { db } from "@/lib/db"
import { notifications, staff } from "@/lib/db/schema"
import { and, eq, inArray, lt } from "drizzle-orm"
import { getBreachedComplaints, getStaffByRole } from "@/lib/queries"
import { createNotification } from "./notifications"

const ESCALATION_HOURS = 24

export async function checkAndNotifySlaBreaches() {
  const breached = await getBreachedComplaints()
  if (breached.length === 0) return

  const eeStaff = await getStaffByRole("EE")
  const deanStaff = await getStaffByRole("Dean")
  const aeStaff = await getStaffByRole("AE")

  for (const complaint of breached) {
    const hoursOverdue = Math.round(
      (Date.now() - new Date(complaint.dueAt!).getTime()) / (1000 * 60 * 60)
    )

    const vars = {
      docketNumber: complaint.docketNumber,
      status: complaint.status,
      hoursOverdue: String(hoursOverdue),
      priority: complaint.priority,
    }

    // Find the AE for this complaint via JE → staff.aeId
    let aeEmail: string | null = null
    if (complaint.jeId) {
      const jeRow = await db.select().from(staff).where(eq(staff.id, complaint.jeId)).limit(1)
      if (jeRow[0]?.aeId) {
        const aeRow = await db.select().from(staff).where(eq(staff.id, jeRow[0].aeId)).limit(1)
        if (aeRow[0]) aeEmail = aeRow[0].email
      }
    }

    // Notify AE if not already notified for this complaint
    if (aeEmail) {
      const alreadyNotified = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.type, "SLA_BREACH"),
            eq(notifications.complaintId, complaint.id),
            eq(notifications.recipientEmail, aeEmail)
          )
        )
        .limit(1)

      if (!alreadyNotified[0]) {
        await createNotification({
          recipientEmail: aeEmail,
          type: "SLA_BREACH",
          title: "SLA Breach Alert",
          message: `Complaint ${complaint.docketNumber} has breached its SLA deadline by ${hoursOverdue} hours. Status: ${complaint.status}.`,
          complaintId: complaint.id,
          docketNumber: complaint.docketNumber,
          data: vars,
        })
      }
    }

    // Escalate to EE + Dean after ESCALATION_HOURS
    if (hoursOverdue >= ESCALATION_HOURS) {
      const escalationRecipients = [...eeStaff, ...deanStaff]
      for (const staff of escalationRecipients) {
        const alreadyNotified = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.type, "SLA_BREACH_ESCALATED"),
              eq(notifications.complaintId, complaint.id),
              eq(notifications.recipientEmail, staff.email)
            )
          )
          .limit(1)

        if (!alreadyNotified[0]) {
          await createNotification({
            recipientEmail: staff.email,
            type: "SLA_BREACH_ESCALATED",
            title: "SLA Breach Escalated",
            message: `Complaint ${complaint.docketNumber} has breached SLA by ${hoursOverdue} hours and requires immediate attention. Status: ${complaint.status}.`,
            complaintId: complaint.id,
            docketNumber: complaint.docketNumber,
            data: vars,
          })
        }
      }
    }
  }
}
