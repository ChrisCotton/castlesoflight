import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── CRM Leads ───────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 256 }),
  jobTitle: varchar("jobTitle", { length: 256 }),
  website: varchar("website", { length: 512 }),
  linkedIn: varchar("linkedIn", { length: 512 }),
  stage: mysqlEnum("stage", [
    "new_lead",
    "contacted",
    "qualified",
    "proposal_sent",
    "closed_won",
    "closed_lost",
  ])
    .default("new_lead")
    .notNull(),
  source: mysqlEnum("source", [
    "website_contact",
    "book_download",
    "booking",
    "referral",
    "linkedin",
    "other",
  ])
    .default("website_contact")
    .notNull(),
  dealValue: decimal("dealValue", { precision: 12, scale: 2 }),
  offerInterest: mysqlEnum("offerInterest", ["sprint", "advisory", "both", "unknown"])
    .default("unknown")
    .notNull(),
  notes: text("notes"),
  tags: json("tags").$type<string[]>().default([]),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Interactions (timeline) ─────────────────────────────────────────────────
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", ["note", "email", "call", "meeting", "booking", "stage_change", "system"])
    .notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  body: text("body"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ─── Call Types (booking configuration) ──────────────────────────────────────
export const callTypes = mysqlTable("callTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  durationMinutes: int("durationMinutes").notNull().default(30),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 8 }).default("USD"),
  isActive: boolean("isActive").default(true).notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CallType = typeof callTypes.$inferSelect;
export type InsertCallType = typeof callTypes.$inferInsert;

// ─── Availability (weekly schedule) ──────────────────────────────────────────
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sun, 1=Mon … 6=Sat
  startTime: varchar("startTime", { length: 8 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 8 }).notNull(),     // "17:00"
  isActive: boolean("isActive").default(true).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("America/Los_Angeles"),
});

export type Availability = typeof availability.$inferSelect;

// ─── Blocked Dates ────────────────────────────────────────────────────────────
export const blockedDates = mysqlTable("blockedDates", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 16 }).notNull(), // "YYYY-MM-DD"
  reason: varchar("reason", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockedDate = typeof blockedDates.$inferSelect;

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  callTypeId: int("callTypeId").notNull(),
  leadId: int("leadId"),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 256 }),
  message: text("message"),
  scheduledDate: varchar("scheduledDate", { length: 16 }).notNull(), // "YYYY-MM-DD"
  scheduledTime: varchar("scheduledTime", { length: 8 }).notNull(),  // "HH:MM"
  timezone: varchar("timezone", { length: 64 }).default("America/Los_Angeles"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"])
    .default("pending")
    .notNull(),
  confirmationToken: varchar("confirmationToken", { length: 128 }),
  adminNotes: text("adminNotes"),
  // Stripe payment fields
  stripeSessionId: varchar("stripeSessionId", { length: 256 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 256 }),
  paymentStatus: mysqlEnum("paymentStatus", ["free", "pending", "paid", "failed", "refunded"])
    .default("free")
    .notNull(),
  priceCents: int("priceCents").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Email Captures (book download lead magnet) ───────────────────────────────
export const emailCaptures = mysqlTable("emailCaptures", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  firstName: varchar("firstName", { length: 128 }),
  source: varchar("source", { length: 128 }).default("book_download"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailCapture = typeof emailCaptures.$inferSelect;
