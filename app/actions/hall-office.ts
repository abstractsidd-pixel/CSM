"use server"

import { db } from "@/lib/db"
import { complaints, complaintLogs } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-log"
import { buildings, categories } from "@/lib/db/schema"

const RATE_WINDOW_MS = 60 * 1000
const RATE_MAX = 10
const rateMap = new Map<string, { count: number; windowStart: number }>()

async function checkMutationLimit(): Promise<string | null> {
  const session = await getSession()
  const key = session?.email || "anonymous"
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(key, { count: 1, windowStart: now })
    return null
  }
  entry.count++
  if (entry.count > RATE_MAX) return "Too many requests. Please wait a moment."
  return null
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
        sql`COALESCE(${complaints.categoryId}, 0) = COALESCE(${categoryId ?? 0}, 0)`,
        sql`${complaints.status} != 'Pending Review'`,
        sql`${complaints.status} != 'Rejected'`,
      )
    )

  const seq = count + 1
  return `IITGoa/CMS/${buildingCode}/${categoryCode}/${year}/${pad(seq)}`
}

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

  const realDocket = await generateDocket(c.buildingId, c.categoryId)

  await db
    .update(complaints)
    .set({
      docketNumber: realDocket,
      status: "Registered",
      reviewedBy: session.staffId ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(complaints.id, id))

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
  return { ok: true }
}
