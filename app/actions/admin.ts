"use server"

import { db } from "@/lib/db"
import {
  buildings,
  technicians,
  categories,
  slaRules,
  notificationTemplates,
  staff,
  users,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { logActivity } from "@/lib/audit-log"
import { getSession } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import { isAdminRole, ROLES, ADMIN_ROLES, PRIORITIES } from "@/lib/constants"
import type { Role } from "@/lib/constants"

const MUTATION_LIMIT = 30
const MUTATION_WINDOW_MS = 60 * 1000
const MIN_PASSWORD_LENGTH = 6

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

function requireEeOrDean(): Promise<string | null> {
  return getSession().then((s) => {
    if (!s) return "Unauthorized."
    if (s.role !== "EE" && s.role !== "Dean") return "Requires EE or Dean role."
    return null
  })
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (password.length > 72) return "Password must not exceed 72 characters."
  return null
}

export async function createBuilding(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const name = formData.get("name") as string
  await db.insert(buildings).values({
    name,
    code: formData.get("code") as string,
    floors: Number(formData.get("floors")) || 1,
    area: (formData.get("area") as string) || null,
    jeId: formData.get("jeId") ? Number(formData.get("jeId")) : null,
  })
  await logActivity(session?.email || "system", session?.role || "system", "BUILDING_CREATED", `Building: ${name}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function deleteBuilding(id: number) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  await db.delete(buildings).where(eq(buildings.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "BUILDING_DELETED", `Building ID: ${id}`)
  revalidatePath("/admin/settings")
}

export async function createStaff(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const password = formData.get("password") as string
  if (!password) return { error: "Password is required." }

  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const passwordHash = await bcrypt.hash(password, 12)

  const staffData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: (formData.get("role") as string) || "JE",
    subdivision: (formData.get("subdivision") as string) || null,
    buildingId: formData.get("buildingId") ? Number(formData.get("buildingId")) : null,
    aeId: formData.get("aeId") ? Number(formData.get("aeId")) : null,
  }

  if (!ADMIN_ROLES.includes(staffData.role as typeof ADMIN_ROLES[number])) {
    return { error: "Invalid role. Must be JE, AE, EE, or Dean." }
  }

  await db.transaction(async (tx) => {
    const existing = await tx.select().from(users).where(eq(users.email, staffData.email)).limit(1)
    if (existing.length > 0) {
      await tx.update(users).set({
        name: staffData.name,
        role: staffData.role,
        passwordHash,
      }).where(eq(users.email, staffData.email))
    } else {
      await tx.insert(users).values({
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
        passwordHash,
      })
    }
    await tx.insert(staff).values(staffData)
  })

  await logActivity(session?.email || "system", session?.role || "system", "STAFF_CREATED", `Staff: ${staffData.name} (${staffData.email}) Role: ${staffData.role}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function createTechnician(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const name = formData.get("name") as string
  await db.insert(technicians).values({
    name,
    trade: formData.get("trade") as string,
    contact: (formData.get("contact") as string) || null,
    area: (formData.get("area") as string) || null,
    status: (formData.get("status") as string) || "Active",
  })
  await logActivity(session?.email || "system", session?.role || "system", "TECHNICIAN_CREATED", `Technician: ${name}`)
  revalidatePath("/admin/technicians")
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function updateTechnician(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))

  if (!id) return { error: "Technician is required." }

  await db
    .update(technicians)
    .set({
      name: formData.get("name") as string,
      trade: formData.get("trade") as string,
      contact: (formData.get("contact") as string) || null,
      area: (formData.get("area") as string) || null,
      status: (formData.get("status") as string) || "Active",
    })
    .where(eq(technicians.id, id))

  await logActivity(session?.email || "system", session?.role || "system", "TECHNICIAN_UPDATED", `Technician ID: ${id}`)
  revalidatePath("/admin/technicians")
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function toggleTechnician(id: number, status: string) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  await db.update(technicians).set({ status }).where(eq(technicians.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "TECHNICIAN_STATUS_CHANGED", `Technician ID: ${id} Status: ${status}`)
  revalidatePath("/admin/technicians")
}

export async function createCategory(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const name = formData.get("name") as string
  await db.insert(categories).values({
    name,
    parentId: formData.get("parentId") ? Number(formData.get("parentId")) : null,
    level: Number(formData.get("level")) || 1,
    trade: (formData.get("trade") as string) || null,
  })
  await logActivity(session?.email || "system", session?.role || "system", "CATEGORY_CREATED", `Category: ${name}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function deleteCategory(id: number) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  await db.delete(categories).where(eq(categories.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "CATEGORY_DELETED", `Category ID: ${id}`)
  revalidatePath("/admin/settings")
}

export async function updateSla(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const priority = formData.get("priority") as string
  const hours = Number(formData.get("hours"))

  if (!PRIORITIES.includes(priority as typeof PRIORITIES[number])) {
    return { error: "Invalid priority." }
  }

  await db.update(slaRules).set({ hours }).where(eq(slaRules.priority, priority))
  await logActivity(session?.email || "system", session?.role || "system", "SLA_UPDATED", `Priority: ${priority} Hours: ${hours}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function updateTemplate(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  await db
    .update(notificationTemplates)
    .set({
      subject: (formData.get("subject") as string) || null,
      body: formData.get("body") as string,
      channel: (formData.get("channel") as string) || "Email",
    })
    .where(eq(notificationTemplates.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "TEMPLATE_UPDATED", `Template ID: ${id}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function createUser(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const email = formData.get("email") as string
  const name = formData.get("name") as string
  const role = (formData.get("role") as string) || "User"
  const password = formData.get("password") as string

  if (!email || !name || !password) {
    return { error: "All fields are required." }
  }

  if (!ROLES.includes(role as typeof ROLES[number])) {
    return { error: "Invalid role." }
  }

  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    return { error: "A user with this email already exists." }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    email,
    name,
    role,
    passwordHash,
  })

  await logActivity(session?.email || "system", session?.role || "system", "USER_CREATED", `User: ${name} (${email}) Role: ${role}`)
  revalidatePath("/admin/users")
  return { ok: true }
}

export async function deleteUser(id: number) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  const userName = rows[0]?.name || "unknown"
  const userEmail = rows[0]?.email || "unknown"
  await db.delete(users).where(eq(users.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "USER_DELETED", `User: ${userName} (${userEmail}) ID: ${id}`)
  revalidatePath("/admin/users")
}

export async function updateUser(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  if (!id) return { error: "User ID is required." }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as string

  if (!ROLES.includes(role as typeof ROLES[number])) {
    return { error: "Invalid role." }
  }

  const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existingEmail.length > 0 && existingEmail[0].id !== id) {
    return { error: "A user with this email already exists." }
  }

  await db.update(users).set({ name, email, role }).where(eq(users.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "USER_UPDATED", `User ID: ${id} Name: ${name} Email: ${email} Role: ${role}`)
  revalidatePath("/admin/users")
  return { ok: true }
}

export async function createUsersBulk(rows: { name: string; email: string; password: string }[]) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()

  for (const r of rows) {
    const pwError = validatePassword(r.password)
    if (pwError) return { error: `Password error for ${r.email}: ${pwError}` }
  }

  const existingEmails = await db.select({ email: users.email }).from(users)
  const existingSet = new Set(existingEmails.map((e) => e.email))
  const newRows = rows.filter((r) => !existingSet.has(r.email))
  const skipped = rows.length - newRows.length

  if (newRows.length === 0) {
    return { ok: true, count: 0, skipped, error: skipped > 0 ? `All ${skipped} email(s) already exist.` : undefined }
  }

  const values = await Promise.all(
    newRows.map(async (r) => ({
      name: r.name,
      email: r.email,
      role: "User" as const,
      passwordHash: await bcrypt.hash(r.password, 12),
    })),
  )
  await db.insert(users).values(values)
  await logActivity(session?.email || "system", session?.role || "system", "USERS_BULK_CREATED", `${newRows.length} users imported, ${skipped} skipped`)
  revalidatePath("/admin/users")
  return { ok: true, count: newRows.length, skipped }
}

export async function deleteStaff(id: number) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const rows = await db.select().from(staff).where(eq(staff.id, id)).limit(1)
  const staffName = rows[0]?.name || "unknown"
  const staffEmail = rows[0]?.email || "unknown"
  if (rows[0]) {
    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.email, rows[0].email))
      await tx.delete(staff).where(eq(staff.id, id))
    })
  }
  await logActivity(session?.email || "system", session?.role || "system", "STAFF_DELETED", `Staff: ${staffName} (${staffEmail}) ID: ${id}`)
  revalidatePath("/admin/settings")
}

export async function updateStaff(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  if (!id) return { error: "Staff ID is required." }

  const email = formData.get("email") as string
  const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existingEmail.length > 0 && existingEmail[0].id !== id) {
    return { error: "A user with this email already exists." }
  }

  await db
    .update(staff)
    .set({
      name: formData.get("name") as string,
      email,
      role: (formData.get("role") as string) || "JE",
      subdivision: (formData.get("subdivision") as string) || null,
      buildingId: formData.get("buildingId") ? Number(formData.get("buildingId")) : null,
      aeId: formData.get("aeId") ? Number(formData.get("aeId")) : null,
    })
    .where(eq(staff.id, id))

  await logActivity(session?.email || "system", session?.role || "system", "STAFF_UPDATED", `Staff ID: ${id}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function updateUserPassword(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const id = Number(formData.get("id"))
  const password = formData.get("password") as string

  if (!id || !password) return { error: "User ID and password are required." }

  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.update(users).set({ passwordHash }).where(eq(users.id, id))

  await logActivity(session?.email || "system", session?.role || "system", "PASSWORD_RESET", `User ID: ${id}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function changeOwnPassword(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const session = await getSession()
  if (!session) return { error: "Unauthorized." }

  const currentPassword = formData.get("currentPassword") as string
  const password = formData.get("password") as string
  const userId = Number(formData.get("userId"))

  if (!userId || !password) return { error: "Password is required." }
  if (!currentPassword) return { error: "Current password is required." }

  if (session.userId !== userId) {
    return { error: "You can only change your own password." }
  }

  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!userRows[0]) return { error: "User not found." }

  const valid = await bcrypt.compare(currentPassword, userRows[0].passwordHash)
  if (!valid) return { error: "Current password is incorrect." }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId))

  await logActivity(session.email, session.role, "PASSWORD_CHANGED", `Self-service password change for User ID: ${userId}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}
