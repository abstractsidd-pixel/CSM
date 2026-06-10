import { db } from "@/lib/db"
import {
  buildings,
  categories,
  technicians,
  slaRules,
  staff,
  complaints,
  complaintLogs,
  feedback,
  surveys,
  notificationTemplates,
} from "@/lib/db/schema"
import { eq, desc, and, asc } from "drizzle-orm"

export async function getBuildings() {
  return db.select().from(buildings).orderBy(asc(buildings.name))
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.level), asc(categories.name))
}

export async function getTechnicians() {
  return db.select().from(technicians).orderBy(asc(technicians.name))
}

export async function getSlaRules() {
  return db.select().from(slaRules)
}

export async function getStaff() {
  return db.select().from(staff).orderBy(asc(staff.name))
}

export async function getNotificationTemplates() {
  return db.select().from(notificationTemplates).orderBy(asc(notificationTemplates.event))
}

export async function getAllComplaints() {
  return db.select().from(complaints).orderBy(desc(complaints.createdAt))
}

export async function getComplaintsByEmail(email: string) {
  return db
    .select()
    .from(complaints)
    .where(eq(complaints.complainantEmail, email))
    .orderBy(desc(complaints.createdAt))
}

export async function getComplaintByDocket(docket: string) {
  const rows = await db
    .select()
    .from(complaints)
    .where(eq(complaints.docketNumber, docket))
    .limit(1)
  return rows[0] ?? null
}

export async function getComplaintById(id: number) {
  const rows = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1)
  return rows[0] ?? null
}

export async function getLogsForComplaint(complaintId: number) {
  return db
    .select()
    .from(complaintLogs)
    .where(eq(complaintLogs.complaintId, complaintId))
    .orderBy(asc(complaintLogs.createdAt))
}

export async function getFeedbackForComplaint(complaintId: number) {
  const rows = await db
    .select()
    .from(feedback)
    .where(eq(feedback.complaintId, complaintId))
    .orderBy(desc(feedback.createdAt))
    .limit(1)
  return rows[0] ?? null
}

export async function getAllFeedback() {
  return db.select().from(feedback).orderBy(desc(feedback.createdAt))
}

export async function getAllSurveys() {
  return db.select().from(surveys).orderBy(desc(surveys.createdAt))
}

export type ComplaintRow = Awaited<ReturnType<typeof getAllComplaints>>[number]
export type BuildingRow = Awaited<ReturnType<typeof getBuildings>>[number]
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number]
export type TechnicianRow = Awaited<ReturnType<typeof getTechnicians>>[number]
export type StaffRow = Awaited<ReturnType<typeof getStaff>>[number]
export type LogRow = Awaited<ReturnType<typeof getLogsForComplaint>>[number]
