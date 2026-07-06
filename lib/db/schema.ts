import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core"

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  jeId: integer("je_id"),
  isHostel: boolean("is_hostel").notNull().default(false),
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
  aeId: integer("ae_id"),
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
  description: text("description"),
  otherText: text("other_text"),
  priority: text("priority").notNull().default("Minor"),
  preferredTime1: timestamp("preferred_time_1", { withTimezone: true }),
  preferredTime2: timestamp("preferred_time_2", { withTimezone: true }),
  preferredTime3: timestamp("preferred_time_3", { withTimezone: true }),
  selectedTimeSlot: integer("selected_time_slot"),
  photoUrl: text("photo_url"),
  photoPath: text("photo_path"),
  status: text("status").notNull().default("Registered"),
  complainantName: text("complainant_name"),
  complainantEmail: text("complainant_email").notNull(),
  assignedTechnicianId: integer("assigned_technician_id"),
  technicianTrade: text("technician_trade"),
  expectedStart: timestamp("expected_start", { withTimezone: true }),
  assignRemarks: text("assign_remarks"),
  jeId: integer("je_id"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
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

export const complaintComments = pgTable("complaint_comments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  message: text("message").notNull(),
  authorEmail: text("author_email").notNull(),
  authorName: text("author_name"),
  authorRole: text("author_role").notNull(),
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

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  complaintId: integer("complaint_id"),
  docketNumber: text("docket_number"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
