import { db } from "@/lib/db"
import {
  buildings,
  categories,
  technicians,
  slaRules,
  staff,
  complaints,
  complaintLogs,
  complaintComments,
  feedback,
  notificationTemplates,
  users,
  notifications,
} from "@/lib/db/schema"
import { eq, desc, and, asc, sql, lt } from "drizzle-orm"

export async function getBuildings() {
  return db.select().from(buildings).orderBy(asc(buildings.name))
}

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.level), asc(categories.name))
}

export async function getDivisions() {
  return db.select().from(categories).where(eq(categories.level, 1)).orderBy(asc(categories.name))
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

export async function getCommentsForComplaint(complaintId: number) {
  return db
    .select()
    .from(complaintComments)
    .where(eq(complaintComments.complaintId, complaintId))
    .orderBy(asc(complaintComments.createdAt))
}

export async function getAllFeedback() {
  return db.select().from(feedback).orderBy(desc(feedback.createdAt))
}

export async function getAllUsers() {
  return db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt))
}

export async function getNotificationsByEmail(email: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientEmail, email))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
}

export async function getUnreadNotificationCount(email: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.recipientEmail, email), eq(notifications.isRead, false)))
  return rows[0]?.count ?? 0
}

export async function markNotificationsAsRead(email: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.recipientEmail, email), eq(notifications.isRead, false)))
}

export async function getBreachedComplaints() {
  const now = new Date()
  return db
    .select()
    .from(complaints)
    .where(
      and(
        lt(complaints.dueAt, now),
        sql`${complaints.status} NOT IN ('Resolved', 'Closed', 'Rejected', 'Pending Review')`
      )
    )
    .orderBy(desc(complaints.dueAt))
}

export async function getStaffByRole(role: string) {
  return db.select().from(staff).where(eq(staff.role, role))
}

export type NotificationRow = Awaited<ReturnType<typeof getNotificationsByEmail>>[number]
export type ComplaintRow = Awaited<ReturnType<typeof getAllComplaints>>[number]
export type BuildingRow = Awaited<ReturnType<typeof getBuildings>>[number]
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number]
export type TechnicianRow = Awaited<ReturnType<typeof getTechnicians>>[number]
export type LogRow = Awaited<ReturnType<typeof getLogsForComplaint>>[number]
