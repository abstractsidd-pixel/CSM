"use server"

import { db } from "@/lib/db"
import {
  complaints,
  complaintLogs,
  complaintComments,
  feedback,
  buildings,
  categories,
  slaRules,
  staff,
  surveys,
} from "@/lib/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-log"
import { getSession } from "@/lib/session"
import { STATUSES, PRIORITIES } from "@/lib/constants"
import { createNotification, notifyJeStaff } from "./notifications"
import { checkMutationLimit, requireAdmin } from "@/lib/auth-helpers"
import { generateDocket } from "@/lib/docket"

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
  const description = (formData.get("description") as string) || null
  const otherText = (formData.get("otherText") as string) || null
  const priority = (formData.get("priority") as string) || "Minor"
  const photoPath = (formData.get("photoPath") as string) || null
  const complainantName = (formData.get("complainantName") as string) || null
  const complainantEmail = session?.email || ""

  const t1 = (formData.get("preferredTime1") as string) || null
  const t2 = (formData.get("preferredTime2") as string) || null
  const t3 = (formData.get("preferredTime3") as string) || null

  if (!buildingId || !complainantEmail) {
    return { error: "Building and email are required." }
  }

  if (complainantName && complainantName.length > 100) {
    return { error: "Name must be under 100 characters." }
  }
  if (description && description.length > 2000) {
    return { error: "Description must be under 2000 characters." }
  }
  if (otherText && otherText.length > 500) {
    return { error: "Additional details must be under 500 characters." }
  }

  if (!PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
    return { error: "Invalid priority." }
  }

  if (!t1) {
    return { error: "At least the first preferred time slot is required." }
  }

  const building = await db.select().from(buildings).where(eq(buildings.id, buildingId)).limit(1)
  const isHostel = building[0]?.isHostel ?? false
  const due = await dueDateFor(priority)

  if (isHostel) {
    const now = new Date()
    const pendingDocket = `PENDING-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`

    const [created] = await db
      .insert(complaints)
      .values({
        docketNumber: pendingDocket,
        buildingId,
        floor,
        room,
        categoryId,
        subcategoryId,
        categoryLabel,
        description,
        otherText,
        priority,
        preferredTime1: t1 ? new Date(t1) : null,
        preferredTime2: t2 ? new Date(t2) : null,
        preferredTime3: t3 ? new Date(t3) : null,
        photoPath,
        status: "Pending Review",
        complainantName,
        complainantEmail,
        dueAt: due,
      })
      .returning()

    await db.insert(complaintLogs).values({
      complaintId: created.id,
      action: "Pending Review",
      details: `Hostel complaint submitted for Hall Office review. Priority: ${priority}.`,
      staffLabel: complainantName || complainantEmail,
    })

    await logActivity(session?.email || complainantEmail, session?.role || "User", "COMPLAINT_SUBMITTED", `Docket: ${pendingDocket} Building: ${buildingId} Priority: ${priority}`)
    revalidatePath("/track")
    revalidatePath("/hall-office")

    const hoStaff = await db.select().from(staff).where(eq(staff.role, "HallOffice"))
    for (const ho of hoStaff) {
      await createNotification({
        recipientEmail: ho.email,
        type: "NEW_COMPLAINT",
        title: "New Complaint Pending Review",
        message: `A new ${priority} priority hostel complaint (${pendingDocket}) from ${building[0]?.name || "a hostel building"} is awaiting your review.`,
        complaintId: created.id,
        docketNumber: pendingDocket,
        data: {
          complainantName: complainantName || "",
          buildingName: building[0]?.name || "",
          priority,
          description: description || "",
        },
      })
    }

    return { docket: created.docketNumber }
  }

  const docket = await generateDocket(buildingId, categoryId)

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
      description,
      otherText,
      priority,
      preferredTime1: t1 ? new Date(t1) : null,
      preferredTime2: t2 ? new Date(t2) : null,
      preferredTime3: t3 ? new Date(t3) : null,
      photoPath,
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

  await notifyJeStaff(building[0]?.jeId, {
    type: "NEW_COMPLAINT",
    title: "New Complaint Registered",
    message: `A new ${priority} priority complaint (${docket}) has been registered in ${building[0]?.name || "your building"}.`,
    complaintId: created.id,
    docketNumber: docket,
  }, {
    complainantName: complainantName || "",
    buildingName: building[0]?.name || "",
    priority,
    description: description || "",
  })

  return { docket: created.docketNumber }
}

export async function editComplaint(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  const id = Number(formData.get("id"))
  const description = (formData.get("description") as string) || null
  const otherText = (formData.get("otherText") as string) || null
  const priority = (formData.get("priority") as string) || "Minor"
  const floor = (formData.get("floor") as string) || null
  const room = (formData.get("room") as string) || null
  const photoPath = (formData.get("photoPath") as string) || null

  const t1 = (formData.get("preferredTime1") as string) || null
  const t2 = (formData.get("preferredTime2") as string) || null
  const t3 = (formData.get("preferredTime3") as string) || null

  if (!id) return { error: "Complaint ID is required." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const existing = rows[0]
  if (!existing) return { error: "Complaint not found." }

  if (existing.complainantEmail !== session.email) {
    return { error: "You can only edit your own complaints." }
  }

  const editableStatuses = ["Registered", "Reactivated"]
  if (!editableStatuses.includes(existing.status)) {
    return { error: "Complaint can only be edited when Registered or Reactivated." }
  }

  if (!PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
    return { error: "Invalid priority." }
  }

  if (!t1) {
    return { error: "At least the first preferred time slot is required." }
  }

  await db
    .update(complaints)
    .set({
      description,
      otherText,
      priority,
      floor,
      room,
      photoPath: photoPath || existing.photoPath,
      preferredTime1: t1 ? new Date(t1) : null,
      preferredTime2: t2 ? new Date(t2) : null,
      preferredTime3: t3 ? new Date(t3) : null,
    })
    .where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Complaint Edited",
    details: "Complainant updated complaint details.",
    staffLabel: session.name || session.email,
  })

  await logActivity(session.email, session.role, "COMPLAINT_EDITED", `Docket: ${existing.docketNumber}`)
  revalidatePath("/track")
  revalidatePath(`/admin/complaints/${id}`)

  await notifyJeStaff(existing.jeId, {
    type: "COMPLAINT_EDITED",
    title: "Complaint Updated by Complainant",
    message: `Complaint ${existing.docketNumber} has been updated by the complainant.`,
    complaintId: id,
    docketNumber: existing.docketNumber,
  }, {
    complainantName: existing.complainantName || "",
  })

  return { ok: true }
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
  const selectedTimeSlot = formData.get("selectedTimeSlot") ? Number(formData.get("selectedTimeSlot")) : null

  if (!id || !technicianId) return { error: "Technician is required." }

  const existing = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = existing[0]
  const isFirstAssign = !c?.assignedTechnicianId

  const updateData: Record<string, unknown> = {
    assignedTechnicianId: technicianId,
    technicianTrade,
    expectedStart: expectedStart ? new Date(expectedStart) : null,
    assignRemarks,
    status: "Assigned",
    assignedAt: new Date(),
  }
  if (isFirstAssign && selectedTimeSlot && [1, 2, 3].includes(selectedTimeSlot)) {
    updateData.selectedTimeSlot = selectedTimeSlot
  }

  await db
    .update(complaints)
    .set(updateData)
    .where(eq(complaints.id, id))

  let timeDetail = ""
  if (isFirstAssign && selectedTimeSlot && [1, 2, 3].includes(selectedTimeSlot)) {
    const slotTime = selectedTimeSlot === 1 ? c?.preferredTime1 : selectedTimeSlot === 2 ? c?.preferredTime2 : c?.preferredTime3
    if (slotTime) {
      timeDetail = ` Visit: ${new Date(slotTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
    }
  }
  if (expectedStart) {
    timeDetail += ` Expected start: ${new Date(expectedStart).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`
  }

  const remarksDetail = assignRemarks ? ` Remarks: ${assignRemarks}.` : ""

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Assigned",
    details: `Assigned to ${technicianName ?? `technician #${technicianId}`}.${timeDetail}${remarksDetail}`.trim(),
    staffLabel,
  })

  await logActivity(session?.email || "system", session?.role || "system", "COMPLAINT_ASSIGNED", `Complaint ID: ${id} Technician: ${technicianName || technicianId}`)
  revalidatePath("/admin")
  revalidatePath("/track")

  if (c?.complainantEmail) {
    await createNotification({
      recipientEmail: c.complainantEmail,
      type: "COMPLAINT_ASSIGNED",
      title: "Your Complaint Has Been Assigned",
      message: `Your complaint ${c.docketNumber} has been assigned to ${technicianName || `technician #${technicianId}`}.${timeDetail}`,
      complaintId: id,
      docketNumber: c.docketNumber,
      data: {
        complainantName: c.complainantName || "",
        technicianName: technicianName || "",
        expectedStart: expectedStart || "",
        assignRemarks: assignRemarks || "",
      },
    })
  }

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

  const complaintRows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const complaint = complaintRows[0]
  if (complaint?.complainantEmail) {
    await createNotification({
      recipientEmail: complaint.complainantEmail,
      type: "STATUS_CHANGED",
      title: "Complaint Status Updated",
      message: `Your complaint ${complaint.docketNumber} status has been changed to "${status}".${note ? ` Note: ${note}` : ""}`,
      complaintId: id,
      docketNumber: complaint.docketNumber,
      data: {
        complainantName: complaint.complainantName || "",
        status,
        note: note || "",
      },
    })
  }

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

  await notifyJeStaff(c.jeId, {
    type: "COMPLAINT_REACTIVATED",
    title: "Complaint Reactivated",
    message: `Complaint ${c.docketNumber} has been reactivated by the complainant. Reason: ${reason}`,
    complaintId: id,
    docketNumber: c.docketNumber,
  }, {
    reason,
    complainantName: c.complainantName || "",
  })

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

export async function reassignCategory(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  const categoryId = Number(formData.get("categoryId"))

  if (!id || !categoryId) return { error: "Complaint ID and category are required." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  const c = rows[0]
  if (!c) return { error: "Complaint not found." }

  const catRows = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
  const cat = catRows[0]
  if (!cat) return { error: "Category not found." }

  const oldCategoryLabel = c.categoryLabel || "—"

  await db
    .update(complaints)
    .set({
      categoryId,
      categoryLabel: cat.name,
    })
    .where(eq(complaints.id, id))

  await db.insert(complaintLogs).values({
    complaintId: id,
    action: "Category Reassigned",
    details: `Category changed from "${oldCategoryLabel}" to "${cat.name}".`,
    staffLabel: `${session?.name || "Staff"} (${session?.role})`,
  })

  await logActivity(session?.email || "system", session?.role || "system", "COMPLAINT_CATEGORY_REASSIGNED", `Complaint ID: ${id} New Category: ${cat.name}`)
  revalidatePath("/admin")
  revalidatePath(`/admin/complaints/${id}`)
  return { ok: true }
}

export async function addComment(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  const complaintId = Number(formData.get("complaintId"))
  const message = (formData.get("message") as string)?.trim()

  if (!complaintId || !message) return { error: "Complaint ID and message are required." }
  if (message.length > 2000) return { error: "Comment must be under 2000 characters." }

  const rows = await db.select().from(complaints).where(eq(complaints.id, complaintId)).limit(1)
  const complaint = rows[0]
  if (!complaint) return { error: "Complaint not found." }

  const isAdmin = ["Admin", "EE", "Dean", "JE", "AE"].includes(session.role)
  const isComplainant = complaint.complainantEmail === session.email
  if (!isAdmin && !isComplainant) {
    return { error: "You do not have access to this complaint." }
  }

  await db.insert(complaintComments).values({
    complaintId,
    message,
    authorEmail: session.email,
    authorName: session.name,
    authorRole: session.role,
  })

  await db.insert(complaintLogs).values({
    complaintId,
    action: "Comment",
    details: message.length > 100 ? message.slice(0, 100) + "…" : message,
    staffLabel: `${session.name} (${session.role})`,
  })

  const notifyEmails: string[] = []
  if (complaint.complainantEmail && complaint.complainantEmail !== session.email) {
    notifyEmails.push(complaint.complainantEmail)
  }
  if (complaint.jeId) {
    const jeRows = await db.select().from(staff).where(eq(staff.id, complaint.jeId)).limit(1)
    if (jeRows[0]?.email && jeRows[0].email !== session.email) {
      notifyEmails.push(jeRows[0].email)
    }
  }
  for (const email of notifyEmails) {
    await createNotification({
      recipientEmail: email,
      type: "NEW_COMMENT",
      title: "New Comment on Complaint",
      message: `${session.name || session.email} commented on ${complaint.docketNumber}: "${message.length > 80 ? message.slice(0, 80) + "…" : message}"`,
      complaintId,
      docketNumber: complaint.docketNumber,
      data: {
        authorName: session.name || session.email,
        comment: message,
      },
    })
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/complaints/${complaintId}`)
  revalidatePath("/track")
  return { ok: true }
}
