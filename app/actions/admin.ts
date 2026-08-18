"use server"

import { db } from "@/lib/db"
import {
  buildings,
  technicians,
  categories,
  slaRules,
  staff,
  users,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-log"
import { getSession } from "@/lib/session"
import { isAdminRole, ROLES, ADMIN_ROLES, PRIORITIES } from "@/lib/constants"
import { checkMutationLimit, requireAdmin, requireEeOrDean } from "@/lib/auth-helpers"

export async function createBuilding(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireAdmin()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const name = (formData.get("name") as string)?.trim()
  const code = (formData.get("code") as string)?.trim()
  if (!name || name.length > 100) return { error: "Building name is required (max 100 chars)." }
  if (code && code.length > 20) return { error: "Building code must be under 20 characters." }
  await db.insert(buildings).values({
    name,
    code: code || "",
    floors: Number(formData.get("floors")) || 1,
    area: (formData.get("area") as string) || null,
    isHostel: formData.get("isHostel") === "true",
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

  const staffData = {
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    role: (formData.get("role") as string) || "JE",
    subdivision: ((formData.get("subdivision") as string) || "").trim() || null,
    buildingId: formData.get("buildingId") ? Number(formData.get("buildingId")) : null,
    aeId: formData.get("aeId") ? Number(formData.get("aeId")) : null,
  }

  if (!staffData.name || staffData.name.length > 100) return { error: "Staff name is required (max 100 chars)." }
  if (!staffData.email || staffData.email.length > 254) return { error: "Valid email is required." }

  const validRoles = ["HallOffice", ...ADMIN_ROLES]
  if (!validRoles.includes(staffData.role as typeof validRoles[number])) {
    return { error: "Invalid role. Must be HallOffice, JE, AE, EE, or Dean." }
  }

  await db.insert(staff).values(staffData)

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
  const level = Number(formData.get("level")) || 1
  const priority = (formData.get("priority") as string) || null

  await db.insert(categories).values({
    name,
    parentId: formData.get("parentId") ? Number(formData.get("parentId")) : null,
    level,
    trade: (formData.get("trade") as string) || null,
    priority: level === 2 ? priority : null,
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

export async function createDivision(formData: FormData) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Division name is required." }

  const existing = await db.select().from(categories).where(eq(categories.name, name)).limit(1)
  if (existing.length > 0) return { error: "A division with this name already exists." }

  await db.insert(categories).values({ name, level: 1 })
  await logActivity(session?.email || "system", session?.role || "system", "DIVISION_CREATED", `Division: ${name}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function deleteDivision(id: number) {
  const limitError = await checkMutationLimit()
  if (limitError) return { error: limitError }

  const roleError = await requireEeOrDean()
  if (roleError) return { error: roleError }

  const session = await getSession()
  const row = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
  if (row[0]?.level !== 1) return { error: "Only level-1 categories (divisions) can be deleted." }

  const hasSubcategories = await db.select().from(categories).where(eq(categories.parentId, id)).limit(1)
  if (hasSubcategories.length > 0) return { error: "Cannot delete a division that has subcategories. Remove them first." }

  await db.delete(categories).where(eq(categories.id, id))
  await logActivity(session?.email || "system", session?.role || "system", "DIVISION_DELETED", `Division ID: ${id} Name: ${row[0]?.name}`)
  revalidatePath("/admin/settings")
  return { ok: true }
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
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const staffRow = await db.select().from(staff).where(eq(staff.id, id)).limit(1)
  if (existingUser.length > 0 && staffRow.length > 0 && existingUser[0].email !== staffRow[0].email) {
    return { error: "A user with this email already exists." }
  }

  await db
    .update(staff)
    .set({
      name: formData.get("name") as string,
      email,
      role: (formData.get("role") as string) || "JE",
      subdivision: ((formData.get("subdivision") as string) || "").trim() || null,
      buildingId: formData.get("buildingId") ? Number(formData.get("buildingId")) : null,
      aeId: formData.get("aeId") ? Number(formData.get("aeId")) : null,
    })
    .where(eq(staff.id, id))

  await logActivity(session?.email || "system", session?.role || "system", "STAFF_UPDATED", `Staff ID: ${id}`)
  revalidatePath("/admin/settings")
  return { ok: true }
}
