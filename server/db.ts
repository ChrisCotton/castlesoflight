import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  availability,
  blockedDates,
  bookings,
  callTypes,
  emailCaptures,
  emailTemplates,
  interactions,
  leads,
  newsletterIssues,
  newsletterSubscribers,
  users,
  type EmailTemplate,
  type InsertEmailTemplate,
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
export async function getLeadStats() {
  const db = await getDb();
  if (!db) return null;

  const [byStage, bySource, byOffer, recentLeads, wonLeads, allActive] = await Promise.all([
    // Pipeline value and count by stage
    db.select({
      stage: leads.stage,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(dealValue), 0)`,
    })
      .from(leads)
      .where(eq(leads.isArchived, false))
      .groupBy(leads.stage),

    // Lead count by source
    db.select({
      source: leads.source,
      count: sql<number>`count(*)`,
    })
      .from(leads)
      .where(eq(leads.isArchived, false))
      .groupBy(leads.source),

    // Lead count by offer interest
    db.select({
      offerInterest: leads.offerInterest,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(dealValue), 0)`,
    })
      .from(leads)
      .where(eq(leads.isArchived, false))
      .groupBy(leads.offerInterest),

    // Leads added in last 30 days (for velocity chart)
    db.select({
      date: sql<string>`DATE(createdAt)`,
      count: sql<number>`count(*)`,
    })
      .from(leads)
      .where(and(
        eq(leads.isArchived, false),
        gte(leads.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      ))
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`),

    // Won deals
    db.select({
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(dealValue), 0)`,
    })
      .from(leads)
      .where(and(eq(leads.isArchived, false), eq(leads.stage, "closed_won"))),

    // All active (non-lost, non-archived) for totals
    db.select({
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(dealValue), 0)`,
    })
      .from(leads)
      .where(and(
        eq(leads.isArchived, false),
        ne(leads.stage, "closed_lost")
      )),
  ]);

  const totalActive = Number(allActive[0]?.count ?? 0);
  const totalPipeline = Number(allActive[0]?.totalValue ?? 0);
  const wonCount = Number(wonLeads[0]?.count ?? 0);
  const wonValue = Number(wonLeads[0]?.totalValue ?? 0);
  const closedCount = byStage.filter(s => s.stage === "closed_won" || s.stage === "closed_lost")
    .reduce((sum, s) => sum + Number(s.count), 0);
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const avgDealSize = totalActive > 0 ? Math.round(totalPipeline / totalActive) : 0;

  return {
    byStage: byStage.map(s => ({ stage: s.stage, count: Number(s.count), totalValue: Number(s.totalValue) })),
    bySource: bySource.map(s => ({ source: s.source, count: Number(s.count) })),
    byOffer: byOffer.map(o => ({ offerInterest: o.offerInterest, count: Number(o.count), totalValue: Number(o.totalValue) })),
    recentLeads: recentLeads.map(r => ({ date: r.date, count: Number(r.count) })),
    summary: {
      totalActive,
      totalPipeline,
      wonCount,
      wonValue,
      winRate,
      avgDealSize,
    },
  };
}

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

// ─── Email Templates ──────────────────────────────────────────────────────────
export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).orderBy(emailTemplates.category, emailTemplates.name);
}

export async function getEmailTemplateById(id: number): Promise<EmailTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createEmailTemplate(data: Omit<InsertEmailTemplate, "id" | "createdAt" | "updatedAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(emailTemplates).values({ ...data });
  return (result[0] as { insertId: number }).insertId;
}

export async function updateEmailTemplate(id: number, data: Partial<Omit<InsertEmailTemplate, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

export async function seedBuiltInTemplates(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Only seed if no built-in templates exist yet
  const existing = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.isBuiltIn, true)).limit(1);
  if (existing.length > 0) return;

  const templates: Omit<InsertEmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "LinkedIn First Touch",
      category: "first_touch",
      subject: "Quick question about {{company}}'s infrastructure",
      variables: ["firstName", "company", "jobTitle", "painPoint"],
      isBuiltIn: true,
      bodyHtml: `<p>Hi {{firstName}},</p>
<p>I came across your profile and noticed {{company}} is scaling fast — congrats on the growth.</p>
<p>I'm Christopher Cotton, an infrastructure architect with 30 years across Spotify, Google ProServe, and Raytheon. I specialize in one thing: compressing 3-month infrastructure buildouts into 48 hours using AI-augmented DevOps.</p>
<p>I work with engineering leaders who are tired of watching {{painPoint}} slow down their roadmap. If that resonates, I'd love to show you what's possible in a 30-minute call — no pitch, just a diagnostic conversation.</p>
<p>Worth a quick chat?</p>
<p>— Christopher</p>`,
    },
    {
      name: "Follow-Up (No Response)",
      category: "follow_up",
      subject: "Re: {{company}}'s infrastructure",
      variables: ["firstName", "company"],
      isBuiltIn: true,
      bodyHtml: `<p>Hi {{firstName}},</p>
<p>I sent a note last week about infrastructure acceleration at {{company}} — wanted to follow up in case it got buried.</p>
<p>I'll keep this short: I help engineering teams ship infrastructure 10x faster using AI-augmented DevOps. My last three clients cut deployment lag by 80–99% within 48 hours of engagement.</p>
<p>If the timing isn't right, no worries at all. But if you're dealing with slow deploys, cloud cost overruns, or a backlog that keeps growing — I'd love to talk.</p>
<p>15 minutes this week?</p>
<p>— Christopher</p>`,
    },
    {
      name: "Proposal Follow-Up",
      category: "proposal",
      subject: "Following up on The Sprint proposal — {{company}}",
      variables: ["firstName", "company", "proposalValue", "sprintScope"],
      isBuiltIn: true,
      bodyHtml: `<p>Hi {{firstName}},</p>
<p>I wanted to follow up on the proposal I sent for {{company}}. I know decisions like this take time, and I want to make sure you have everything you need.</p>
<p>To recap what's on the table: {{sprintScope}} — delivered in 48 hours, guaranteed. The investment is {{proposalValue}}.</p>
<p>A few things I can offer to make this easier:</p>
<ul>
  <li>A 30-minute technical deep-dive call to walk through the exact deliverables</li>
  <li>References from two recent clients in similar situations</li>
  <li>A phased payment option if that helps with budget timing</li>
</ul>
<p>What would be most useful for you right now?</p>
<p>— Christopher</p>`,
    },
    {
      name: "Closed-Won Thank You",
      category: "closed_won",
      subject: "Welcome aboard — let's build something great, {{firstName}}",
      variables: ["firstName", "company", "startDate", "deliverable"],
      isBuiltIn: true,
      bodyHtml: `<p>Hi {{firstName}},</p>
<p>I'm genuinely excited to work with you and the {{company}} team. This is going to be a great engagement.</p>
<p>Here's what happens next:</p>
<ol>
  <li><strong>Kickoff call:</strong> We'll schedule a 60-minute session to align on scope, access requirements, and success metrics.</li>
  <li><strong>Diagnostic phase:</strong> I'll spend the first few hours mapping your current infrastructure and identifying the highest-leverage intervention points.</li>
  <li><strong>Build phase:</strong> {{deliverable}} — delivered by {{startDate}}.</li>
</ol>
<p>I'll send a calendar invite for the kickoff within 24 hours. In the meantime, if you can start gathering read-only access credentials for your cloud environment, that will save us time on day one.</p>
<p>Let's build something great.</p>
<p>— Christopher</p>`,
    },
    {
      name: "Re-Engagement (90-Day)",
      category: "re_engagement",
      subject: "Checking in — how's the infrastructure holding up at {{company}}?",
      variables: ["firstName", "company", "previousContext"],
      isBuiltIn: true,
      bodyHtml: `<p>Hi {{firstName}},</p>
<p>It's been a few months since we last connected. I've been heads-down on some interesting work — most recently helping a fintech team cut their cloud spend by 80% while doubling deployment frequency.</p>
<p>I wanted to check in on {{company}}. {{previousContext}}</p>
<p>A lot has changed in the AI-augmented DevOps space in the last 90 days — tools that used to take weeks to configure now take hours. If your infrastructure roadmap has evolved since we last spoke, I'd love to hear what you're working on.</p>
<p>Worth a 20-minute catch-up call?</p>
<p>— Christopher</p>`,
    },
  ];

  for (const t of templates) {
    await db.insert(emailTemplates).values(t);
  }
}
