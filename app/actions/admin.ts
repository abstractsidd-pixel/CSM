"use server"

import { db } from "@/lib/db"
import {
  buildings,
  technicians,
  categories,
  slaRules,
  notificationTemplates,
  staff,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createBuilding(formData: FormData) {
  await db.insert(buildings).values({
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    floors: Number(formData.get("floors")) || 1,
    area: (formData.get("area") as string) || null,
    jeId: formData.get("jeId") ? Number(formData.get("jeId")) : null,
  })
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function deleteBuilding(id: number) {
  await db.delete(buildings).where(eq(buildings.id, id))
  revalidatePath("/admin/settings")
}

export async function createStaff(formData: FormData) {
  await db.insert(staff).values({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: (formData.get("role") as string) || "JE",
    subdivision: (formData.get("subdivision") as string) || null,
    buildingId: formData.get("buildingId") ? Number(formData.get("buildingId")) : null,
  })
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function createTechnician(formData: FormData) {
  await db.insert(technicians).values({
    name: formData.get("name") as string,
    trade: formData.get("trade") as string,
    contact: (formData.get("contact") as string) || null,
    area: (formData.get("area") as string) || null,
    status: (formData.get("status") as string) || "Active",
  })
  revalidatePath("/admin/technicians")
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function updateTechnician(formData: FormData) {
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

  revalidatePath("/admin/technicians")
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function toggleTechnician(id: number, status: string) {
  await db.update(technicians).set({ status }).where(eq(technicians.id, id))
  revalidatePath("/admin/technicians")
}

export async function createCategory(formData: FormData) {
  await db.insert(categories).values({
    name: formData.get("name") as string,
    parentId: formData.get("parentId") ? Number(formData.get("parentId")) : null,
    level: Number(formData.get("level")) || 1,
    trade: (formData.get("trade") as string) || null,
  })
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath("/admin/settings")
}

export async function updateSla(formData: FormData) {
  const priority = formData.get("priority") as string
  const hours = Number(formData.get("hours"))
  await db.update(slaRules).set({ hours }).where(eq(slaRules.priority, priority))
  revalidatePath("/admin/settings")
  return { ok: true }
}

export async function updateTemplate(formData: FormData) {
  const id = Number(formData.get("id"))
  await db
    .update(notificationTemplates)
    .set({
      subject: (formData.get("subject") as string) || null,
      body: formData.get("body") as string,
      channel: (formData.get("channel") as string) || "Email",
    })
    .where(eq(notificationTemplates.id, id))
  revalidatePath("/admin/settings")
  return { ok: true }
}
