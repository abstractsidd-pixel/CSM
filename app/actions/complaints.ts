"use server"

import { db } from "@/lib/db"
import {
  complaints,
  complaintLogs,
  feedback,
  buildings,
  categories,
  slaRules,
  surveys,
} from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-log"
import { getSession } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { isAdminRole, STATUSES, PRIORITIES } from "@/lib/constants"

const MUTATION_LIMIT = 30
const MUTATION_WINDOW_MS = 60 * 1000

async function checkMutationLimit(): Promise<string | null> {
  const session = await getSession()
  const key = `mut:${session?.email || "anonymous"}`
  const { allowed, retryAfterMs } = checkRateLimit(key, MUTATION_LIMIT, MUTATION_WINDOW_MS)
  if (!allowed) {
    return `Too many requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`
  }
  return null
}

function requireAdmin(): Promise<string | null> {
  return getSession().then((s) => {
    if (!s || !isAdminRole(s.role)) return "Unauthorized."
    return null
  })
}

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0")
}

async function generateDocket(buildingId: number, categoryId: number | null) {
  const year = new Date().getFullYear()

  const buildingRows = await db
    .select({ code: buildings.code })
    .from(buildings)
    .where(eq(buildings.id, buildingId))
    .limit(1)
  const buildingCode = buildingRows[0]?.code ?? "UNK"

  let categoryCode = "GEN"
  if (categoryId) {
    const catRows = await db
      .select({ code: categories.code })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)
    categoryCode = catRows[0]?.code ?? "GEN"
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(complaints)
    .where(
      and(
        sql`EXTRACT(YEAR FROM ${complaints.createdAt}) = ${year}`,
        sql`${complaints.buildingId} = ${buildingId}`,
        sql`COALESCE(${complaints.categoryId}, 0) = COALESCE(${categoryId ?? 0}, 0)`
      )
    )

  const seq = count + 1
  return `IITGoa/CMS/${buildingCode}/${categoryCode}/${year}/${pad(seq)}`
}

async function dueDateFor(priority: string) {
  const rules = await db.select().from(slaRules).where(eq(slaRules.priority, priority)).limit(1)
  const hours = rules[0]?.hours ?? 72
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export async function registerComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
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
  const complainantEmail = session?.email || ""

  if (!buildingId || !complainantEmail) {
    return { error: "Building and email are required." }
  }

  if (!PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
    return { error: "Invalid priority." }
  }

  if (photoUrl && !photoUrl.startsWith("https://")) {
    return { error: "Photo URL must use HTTPS." }
  }

  const docket = await generateDocket(buildingId, categoryId)
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

  await logActivity(session?.email || complainantEmail, session?.role || "User", "COMPLAINT_REGISTERED", `Docket: ${docket} Building: ${buildingId} Priority: ${priority}`)
  revalidatePath("/track")
  revalidatePath("/admin")
  return { docket: created.docketNumber }
}

export async function assignComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
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

  await logActivity(session?.email || "system", session?.role || "system", "COMPLAINT_ASSIGNED", `Complaint ID: ${id} Technician: ${technicianName || technicianId}`)
  revalidatePath("/admin")
  revalidatePath("/track")
  return { ok: true }
}

export async function updateStatus(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  const status = formData.get("status") as string
  const note = (formData.get("note") as string) || null
  const staffLabel = (formData.get("staffLabel") as string) || "IWD"

  if (!STATUSES.includes(status as typeof STATUSES[number])) {
    return { error: "Invalid status value." }
  }

  const patch: Record<string, unknown> = { status }
  if (status === "Resolved" || status === "Closed") patch.closedAt = new Date()

  await db.update(complaints).set(patch).where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: status,
    details: note ?? `Status changed to ${status}.`,
    staffLabel,
  })

  await logActivity(session?.email || "system", session?.role || "system", "COMPLAINT_STATUS_CHANGED", `Complaint ID: ${id} New Status: ${status}`)
  revalidatePath("/admin")
  revalidatePath("/track")
  return { ok: true }
}

export async function submitFeedback(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  const complaintId = Number(formData.get("complaintId"))
  const rating = Number(formData.get("rating"))
  const comment = (formData.get("comment") as string) || null

  if (!complaintId || !rating) return { error: "Rating is required." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, complaintId)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }
  if (c.complainantEmail !== session.email) return { error: "You can only submit feedback for your own complaints." }

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

  await logActivity(session.email, session.role, "FEEDBACK_SUBMITTED", `Complaint ID: ${complaintId} Rating: ${rating}/5`)
  revalidatePath("/track")
  revalidatePath("/admin")
  return { ok: true }
}

export async function reactivateComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  const id = Number(formData.get("id"))
  const reason = (formData.get("reason") as string) || "Reopened by complainant."

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }
  if (c.complainantEmail !== session.email) return { error: "You can only reopen your own complaints." }

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

  await logActivity(session.email, session.role, "COMPLAINT_REACTIVATED", `Complaint ID: ${id} Docket: ${c.docketNumber} Reason: ${reason}`)
  revalidatePath("/track")
  revalidatePath("/admin")
  return { ok: true }
}

export async function submitSurvey(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  const rating = Number(formData.get("rating"))
  const comment = (formData.get("comment") as string) || null
  const respondentEmail = (formData.get("respondentEmail") as string) || null
  if (!rating) return { error: "Rating is required." }
  await db.insert(surveys).values({ rating, comment, respondentEmail })
  await logActivity(session?.email || respondentEmail || "system", session?.role || "User", "SURVEY_SUBMITTED", `Rating: ${rating}/5`)
  return { ok: true }
}
