"use server"

import { db } from "@/lib/db"
import { complaints, complaintLogs } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-log"
import { buildings } from "@/lib/db/schema"
import { createNotification, notifyJeStaff } from "./notifications"
import { checkMutationLimit } from "@/lib/auth-helpers"
import { generateDocket } from "@/lib/docket"

export async function getPendingComplaints() {
  return db
    .select()
    .from(complaints)
    .where(eq(complaints.status, "Pending Review"))
    .orderBy(desc(complaints.createdAt))
}

export async function approveComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session || session.role !== "HallOffice") return { error: "Unauthorized." }

  const id = Number(formData.get("id"))
  if (!id) return { error: "Complaint ID is required." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }
  if (c.status !== "Pending Review") return { error: "Complaint is not pending review." }

  const buildingRows = await db.select().from(buildings).where(eq(buildings.id, c.buildingId)).limit(1)
  const jeId = buildingRows[0]?.jeId ?? null

  let realDocket = ""
  for (let attempt = 0; attempt < 3; attempt++) {
    realDocket = await generateDocket(c.buildingId, c.categoryId)
    try {
      await db
        .update(complaints)
        .set({
          docketNumber: realDocket,
          status: "Registered",
          reviewedBy: session.staffId ?? null,
          reviewedAt: new Date(),
          jeId,
        })
        .where(eq(complaints.id, id))
      break
    } catch (e: any) {
      if (e?.code === "23505" && attempt < 2) continue
      throw e
    }
  }

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Approved by Hall Office",
    details: `Complaint verified and registered. Docket: ${realDocket}`,
    staffLabel: `${session.name} (HallOffice)`,
  })

  await logActivity(session.email, session.role, "COMPLAINT_APPROVED", `Complaint ID: ${id} New Docket: ${realDocket}`)
  revalidatePath("/hall-office")
  revalidatePath("/admin")
  revalidatePath("/track")

  if (c.complainantEmail) {
    await createNotification({
      recipientEmail: c.complainantEmail,
      type: "COMPLAINT_APPROVED",
      title: "Complaint Approved",
      message: `Your complaint has been approved by Hall Office. Your docket number is ${realDocket}. You can now track it.`,
      complaintId: id,
      docketNumber: realDocket,
      data: {
        complainantName: c.complainantName || "",
      },
    })
  }

  await notifyJeStaff(jeId, {
    type: "NEW_COMPLAINT",
    title: "New Complaint Registered",
    message: `A hostel complaint (${realDocket}) has been approved and registered by Hall Office in ${buildingRows[0]?.name || "your building"}.`,
    complaintId: id,
    docketNumber: realDocket,
  }, {
    complainantName: c.complainantName || "",
    buildingName: buildingRows[0]?.name || "",
  })

  return { ok: true }
}

export async function rejectComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session || session.role !== "HallOffice") return { error: "Unauthorized." }

  const id = Number(formData.get("id"))
  const reason = (formData.get("reason") as string)?.trim()
  if (!id) return { error: "Complaint ID is required." }
  if (!reason) return { error: "Rejection reason is required." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }
  if (c.status !== "Pending Review") return { error: "Complaint is not pending review." }

  await db
    .update(complaints)
    .set({
      status: "Rejected",
      reviewedBy: session.staffId ?? null,
      reviewedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Rejected by Hall Office",
    details: `Reason: ${reason}`,
    staffLabel: `${session.name} (HallOffice)`,
  })

  await logActivity(session.email, session.role, "COMPLAINT_REJECTED", `Complaint ID: ${id} Reason: ${reason}`)
  revalidatePath("/hall-office")

  if (c.complainantEmail) {
    await createNotification({
      recipientEmail: c.complainantEmail,
      type: "COMPLAINT_REJECTED",
      title: "Complaint Rejected",
      message: `Your complaint (${c.docketNumber}) has been rejected by Hall Office. Reason: ${reason}`,
      complaintId: id,
      docketNumber: c.docketNumber,
      data: {
        reason,
        complainantName: c.complainantName || "",
      },
    })
  }

  return { ok: true }
}
