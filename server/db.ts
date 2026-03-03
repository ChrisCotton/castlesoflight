import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  availability,
  blockedDates,
  bookings,
  callTypes,
  emailCaptures,
  interactions,
  leads,
  newsletterIssues,
  newsletterSubscribers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function getLeads(includeArchived = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = includeArchived ? [] : [eq(leads.isArchived, false)];
  return db
    .select()
    .from(leads)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(leads).values(data);
  return result[0];
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function getLeadInteractions(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(interactions)
    .where(eq(interactions.leadId, leadId))
    .orderBy(desc(interactions.createdAt));
}

export async function addInteraction(data: typeof interactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(interactions).values(data);
}

// ─── Call Types ───────────────────────────────────────────────────────────────
export async function getCallTypes(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = activeOnly ? [eq(callTypes.isActive, true)] : [];
  return db
    .select()
    .from(callTypes)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(callTypes.sortOrder);
}

export async function getCallTypeBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(callTypes).where(eq(callTypes.slug, slug)).limit(1);
  return result[0];
}

export async function updateCallType(id: number, data: Partial<typeof callTypes.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(callTypes).set(data).where(eq(callTypes.id, id));
}

// ─── Availability ─────────────────────────────────────────────────────────────
export async function getAvailability() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(availability).orderBy(availability.dayOfWeek);
}

export async function upsertAvailability(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(availability)
    .where(eq(availability.dayOfWeek, dayOfWeek))
    .limit(1);
  if (existing.length) {
    await db
      .update(availability)
      .set({ startTime, endTime, isActive })
      .where(eq(availability.dayOfWeek, dayOfWeek));
  } else {
    await db.insert(availability).values({ dayOfWeek, startTime, endTime, isActive });
  }
}

// ─── Blocked Dates ────────────────────────────────────────────────────────────
export async function getBlockedDates(fromDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = fromDate ? [gte(blockedDates.date, fromDate)] : [];
  return db
    .select()
    .from(blockedDates)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(blockedDates.date);
}

export async function addBlockedDate(date: string, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(blockedDates).values({ date, reason });
}

export async function removeBlockedDate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(blockedDates).where(eq(blockedDates.id, id));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export async function getBookings(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions =
    status ? [eq(bookings.status, status as "pending" | "confirmed" | "cancelled" | "completed")] : [];
  return db
    .select()
    .from(bookings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getBookedSlots(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ scheduledTime: bookings.scheduledTime })
    .from(bookings)
    .where(
      and(
        eq(bookings.scheduledDate, date),
        ne(bookings.status, "cancelled")
      )
    );
}

export async function createBooking(data: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(bookings).values(data);
  return result[0];
}

export async function updateBooking(id: number, data: Partial<typeof bookings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

// ─── Email Captures ───────────────────────────────────────────────────────────
export async function captureEmail(email: string, firstName?: string, source = "book_download") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(emailCaptures).values({ email, firstName, source });
}

export async function getEmailCaptures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailCaptures).orderBy(desc(emailCaptures.createdAt));
}

// ─── Newsletter Subscribers ──────────────────────────────────────────────────
export async function subscribeToNewsletter(
  email: string,
  firstName?: string,
  lastName?: string,
  source: typeof newsletterSubscribers.$inferInsert["source"] = "landing_page"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  // Upsert: if already subscribed, re-activate; if new, insert
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  if (existing.length) {
    if (existing[0].status === "unsubscribed") {
      await db
        .update(newsletterSubscribers)
        .set({ status: "active", firstName, lastName, unsubscribedAt: null, updatedAt: new Date() })
        .where(eq(newsletterSubscribers.email, email));
    }
    return { isNew: false, subscriber: existing[0] };
  }
  await db.insert(newsletterSubscribers).values({
    email,
    firstName,
    lastName,
    source,
    unsubscribeToken: token,
  });
  const created = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  return { isNew: true, subscriber: created[0] };
}

export async function unsubscribeFromNewsletter(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.unsubscribeToken, token))
    .limit(1);
  if (!existing.length) return false;
  await db
    .update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.unsubscribeToken, token));
  return true;
}

export async function getNewsletterSubscribers(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status
    ? [eq(newsletterSubscribers.status, status as "active" | "unsubscribed" | "bounced")]
    : [];
  return db
    .select()
    .from(newsletterSubscribers)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(newsletterSubscribers.subscribedAt));
}

export async function getNewsletterIssues() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsletterIssues).orderBy(desc(newsletterIssues.createdAt));
}

export async function getNewsletterIssueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(newsletterIssues).where(eq(newsletterIssues.id, id)).limit(1);
  return result[0];
}

export async function createNewsletterIssue(data: typeof newsletterIssues.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(newsletterIssues).values(data);
  const created = await db
    .select()
    .from(newsletterIssues)
    .orderBy(desc(newsletterIssues.createdAt))
    .limit(1);
  return created[0];
}

export async function updateNewsletterIssue(
  id: number,
  data: Partial<typeof newsletterIssues.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(newsletterIssues).set(data).where(eq(newsletterIssues.id, id));
}

export async function getActiveSubscriberCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));
  return Number(result[0]?.count ?? 0);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary() {
  const db = await getDb();
  if (!db) return null;

  const [leadCounts, bookingCounts, emailCaptureCount, pipelineValue, subscriberCount, issueCount] = await Promise.all([
    db.select({ stage: leads.stage, count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.isArchived, false))
      .groupBy(leads.stage),
    db.select({ status: bookings.status, count: sql<number>`count(*)` })
      .from(bookings)
      .groupBy(bookings.status),
    db.select({ count: sql<number>`count(*)` }).from(emailCaptures),
    db.select({ total: sql<number>`sum(dealValue)` })
      .from(leads)
      .where(and(eq(leads.isArchived, false), ne(leads.stage, "closed_lost"))),
    db.select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active")),
    db.select({ count: sql<number>`count(*)` })
      .from(newsletterIssues)
      .where(eq(newsletterIssues.status, "sent")),
  ]);

  return { leadCounts, bookingCounts, emailCaptureCount, pipelineValue, subscriberCount, issueCount };
}
