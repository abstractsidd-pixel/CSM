import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core"

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  jeId: integer("je_id"),
  floors: integer("floors").notNull().default(1),
  area: text("area"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("JE"),
  subdivision: text("subdivision"),
  buildingId: integer("building_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trade: text("trade").notNull(),
  contact: text("contact"),
  area: text("area"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(1),
  trade: text("trade"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const slaRules = pgTable("sla_rules", {
  id: serial("id").primaryKey(),
  priority: text("priority").notNull().unique(),
  hours: integer("hours").notNull(),
  label: text("label").notNull(),
})

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  docketNumber: text("docket_number").notNull().unique(),
  buildingId: integer("building_id").notNull(),
  floor: text("floor"),
  room: text("room"),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
  typeId: integer("type_id"),
  categoryLabel: text("category_label"),
  otherText: text("other_text"),
  priority: text("priority").notNull().default("Minor"),
  preferredAt: timestamp("preferred_at", { withTimezone: true }),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("Registered"),
  complainantName: text("complainant_name"),
  complainantEmail: text("complainant_email").notNull(),
  assignedTechnicianId: integer("assigned_technician_id"),
  technicianTrade: text("technician_trade"),
  expectedStart: date("expected_start"),
  assignRemarks: text("assign_remarks"),
  jeId: integer("je_id"),
  reactivationSuffix: integer("reactivation_suffix").notNull().default(0),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
})

export const complaintLogs = pgTable("complaint_logs", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  staffLabel: text("staff_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  respondentEmail: text("respondent_email"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  event: text("event").notNull().unique(),
  channel: text("channel").notNull().default("Email"),
  subject: text("subject"),
  body: text("body").notNull(),
})

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("User"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
