"use server"

import { db } from "@/lib/db"
import {
  complaints,
  complaintLogs,
  feedback,
  buildings,
  slaRules,
  surveys,
} from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0")
}

async function generateDocket() {
  const year = new Date().getFullYear()
  // count existing for a simple sequential number
  const all = await db.select({ id: complaints.id }).from(complaints)
  const seq = all.length + 1
  return `IWD-${year}-${pad(seq)}`
}

async function dueDateFor(priority: string) {
  const rules = await db.select().from(slaRules).where(eq(slaRules.priority, priority)).limit(1)
  const hours = rules[0]?.hours ?? 72
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export async function registerComplaint(formData: FormData) {
  const buildingId = Number(formData.get("buildingId"))
  const floor = (formData.get("floor") as string) || null
  const room = (formData.get("room") as string) || null
  const categoryId = formData.get("categoryId") ? Number(formData.get("categoryId")) : null
  const subcategoryId = formData.get("subcategoryId")
    ? Number(formData.get("subcategoryId"))
    : null
  const categoryLabel = (formData.get("categoryLabel") as string) || null
  const otherText = (formData.get("otherText") as string) || null
  const priority = (formData.get("priority") as string) || "Minor"
  const preferredAtRaw = formData.get("preferredAt") as string
  const photoUrl = (formData.get("photoUrl") as string) || null
  const complainantName = (formData.get("complainantName") as string) || null
  const complainantEmail = (formData.get("complainantEmail") as string) || ""

  if (!buildingId || !complainantEmail) {
    return { error: "Building and email are required." }
  }

  const docket = await generateDocket()
  const due = await dueDateFor(priority)
  const building = await db.select().from(buildings).where(eq(buildings.id, buildingId)).limit(1)

  const [created] = await db
    .insert(complaints)
    .values({
      docketNumber: docket,
      buildingId,
      floor,
      room,
      categoryId,
      subcategoryId,
      categoryLabel,
      otherText,
      priority,
      preferredAt: preferredAtRaw ? new Date(preferredAtRaw) : null,
      photoUrl,
      status: "Registered",
      complainantName,
      complainantEmail,
      jeId: building[0]?.jeId ?? null,
      dueAt: due,
    })
    .returning()

  await db.insert(complaintLogs).values({
    complaintId: created.id,
    action: "Registered",
    details: `Complaint registered with ${priority} priority.`,
    staffLabel: complainantName || complainantEmail,
  })

  revalidatePath("/track")
  revalidatePath("/admin")
  return { docket: created.docketNumber }
}

export async function assignComplaint(formData: FormData) {
  const id = Number(formData.get("id"))
  const technicianId = Number(formData.get("technicianId"))
  const technicianName = (formData.get("technicianName") as string) || null
  const technicianTrade = (formData.get("technicianTrade") as string) || null
  const expectedStart = (formData.get("expectedStart") as string) || null
  const assignRemarks = (formData.get("assignRemarks") as string) || null
  const staffLabel = (formData.get("staffLabel") as string) || "IWD"

  if (!id || !technicianId) return { error: "Technician is required." }

  await db
    .update(complaints)
    .set({
      assignedTechnicianId: technicianId,
      technicianTrade,
      expectedStart,
      assignRemarks,
      status: "Assigned",
      assignedAt: new Date(),
    })
    .where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Assigned",
    details: `Assigned to ${technicianName ?? `technician #${technicianId}`}. ${assignRemarks ?? ""}`.trim(),
    staffLabel,
  })

  revalidatePath("/admin")
  revalidatePath("/track")
  return { ok: true }
}

export async function updateStatus(formData: FormData) {
  const id = Number(formData.get("id"))
  const status = formData.get("status") as string
  const note = (formData.get("note") as string) || null
  const staffLabel = (formData.get("staffLabel") as string) || "IWD"

  const patch: Record<string, unknown> = { status }
  if (status === "Resolved" || status === "Closed") patch.closedAt = new Date()

  await db.update(complaints).set(patch).where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: status,
    details: note ?? `Status changed to ${status}.`,
    staffLabel,
  })

  revalidatePath("/admin")
  revalidatePath("/track")
  return { ok: true }
}

export async function submitFeedback(formData: FormData) {
  const complaintId = Number(formData.get("complaintId"))
  const rating = Number(formData.get("rating"))
  const comment = (formData.get("comment") as string) || null

  if (!complaintId || !rating) return { error: "Rating is required." }

  await db.insert(feedback).values({ complaintId, rating, comment })
  await db
    .update(complaints)
    .set({ status: "Closed", closedAt: new Date() })
    .where(eq(complaints.id, complaintId))

  await db.insert(complaintLogs).values({
    complaintId,
    action: "Feedback",
    details: `User rated ${rating}/5. ${comment ?? ""}`.trim(),
    staffLabel: "Complainant",
  })

  revalidatePath("/track")
  revalidatePath("/admin")
  return { ok: true }
}

export async function reactivateComplaint(formData: FormData) {
  const id = Number(formData.get("id"))
  const reason = (formData.get("reason") as string) || "Reopened by complainant."

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }

  const newSuffix = c.reactivationSuffix + 1
  await db
    .update(complaints)
    .set({
      status: "Reactivated",
      reactivationSuffix: newSuffix,
      docketNumber: `${c.docketNumber.replace(/-R\d+$/, "")}-R${newSuffix}`,
      closedAt: null,
    })
    .where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Reactivated",
    details: reason,
    staffLabel: "Complainant",
  })

  revalidatePath("/track")
  revalidatePath("/admin")
  return { ok: true }
}

export async function submitSurvey(formData: FormData) {
  const rating = Number(formData.get("rating"))
  const comment = (formData.get("comment") as string) || null
  const respondentEmail = (formData.get("respondentEmail") as string) || null
  if (!rating) return { error: "Rating is required." }
  await db.insert(surveys).values({ rating, comment, respondentEmail })
  return { ok: true }
}
