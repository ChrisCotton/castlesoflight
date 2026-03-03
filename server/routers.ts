import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Public lead capture ──────────────────────────────────────────────────────
const leadRouter = router({
  // Public: submit contact form / book download
  submitContact: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        message: z.string().optional(),
        offerInterest: z.enum(["sprint", "advisory", "both", "unknown"]).optional(),
        source: z.enum(["website_contact", "book_download", "booking", "referral", "linkedin", "other"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.createLead({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        jobTitle: input.jobTitle,
        notes: input.message,
        offerInterest: input.offerInterest ?? "unknown",
        source: input.source ?? "website_contact",
        stage: "new_lead",
      });
      await notifyOwner({
        title: `New Lead: ${input.firstName} ${input.lastName}`,
        content: `${input.email} — ${input.company ?? "No company"} — Interested in: ${input.offerInterest ?? "unknown"}`,
      }).catch(() => {});
      return { success: true };
    }),

  // Admin: list all leads
  list: adminProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }))
    .query(({ input }) => db.getLeads(input.includeArchived ?? false)),

  // Admin: get single lead with interactions
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await db.getLeadById(input.id);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const timeline = await db.getLeadInteractions(input.id);
      return { lead, timeline };
    }),

  // Admin: create lead manually
  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        website: z.string().optional(),
        linkedIn: z.string().optional(),
        stage: z.enum(["new_lead", "contacted", "qualified", "proposal_sent", "closed_won", "closed_lost"]).optional(),
        source: z.enum(["website_contact", "book_download", "booking", "referral", "linkedin", "other"]).optional(),
        dealValue: z.string().optional(),
        offerInterest: z.enum(["sprint", "advisory", "both", "unknown"]).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.createLead({
        ...input,
        stage: input.stage ?? "new_lead",
        source: input.source ?? "other",
        offerInterest: input.offerInterest ?? "unknown",
      });
      return { success: true };
    }),

  // Admin: update lead
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        website: z.string().optional(),
        linkedIn: z.string().optional(),
        stage: z.enum(["new_lead", "contacted", "qualified", "proposal_sent", "closed_won", "closed_lost"]).optional(),
        dealValue: z.string().optional(),
        offerInterest: z.enum(["sprint", "advisory", "both", "unknown"]).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isArchived: z.boolean().optional(),
        lastContactedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existing = await db.getLeadById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      // Log stage change
      if (data.stage && data.stage !== existing.stage) {
        await db.addInteraction({
          leadId: id,
          type: "stage_change",
          title: `Stage changed: ${existing.stage} → ${data.stage}`,
          metadata: { from: existing.stage, to: data.stage },
        });
      }
      await db.updateLead(id, data);
      return { success: true };
    }),

  // Admin: add interaction/note
  addInteraction: adminProcedure
    .input(
      z.object({
        leadId: z.number(),
        type: z.enum(["note", "email", "call", "meeting", "booking", "stage_change", "system"]),
        title: z.string().min(1),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.addInteraction(input);
      await db.updateLead(input.leadId, { lastContactedAt: new Date() });
      return { success: true };
    }),
});

// ─── Booking / Calendly clone ─────────────────────────────────────────────────
const bookingRouter = router({
  // Public: get call types
  getCallTypes: publicProcedure.query(() => db.getCallTypes(true)),

  // Public: get availability for a date
  getAvailableSlots: publicProcedure
    .input(z.object({ date: z.string(), callTypeId: z.number() }))
    .query(async ({ input }) => {
      const dateObj = new Date(input.date + "T12:00:00");
      const dayOfWeek = dateObj.getDay();

      const [avail, blocked, bookedSlots, callType] = await Promise.all([
        db.getAvailability(),
        db.getBlockedDates(input.date),
        db.getBookedSlots(input.date),
        db.getCallTypes(true),
      ]);

      const isBlocked = blocked.some((b) => b.date === input.date);
      if (isBlocked) return { slots: [], isBlocked: true };

      const dayAvail = avail.find((a) => a.dayOfWeek === dayOfWeek && a.isActive);
      if (!dayAvail) return { slots: [], isBlocked: false };

      const ct = callType.find((c) => c.id === input.callTypeId);
      const duration = ct?.durationMinutes ?? 60;

      const bookedTimes = new Set(bookedSlots.map((b) => b.scheduledTime));
      const slots: string[] = [];

      const [startH, startM] = dayAvail.startTime.split(":").map(Number);
      const [endH, endM] = dayAvail.endTime.split(":").map(Number);
      let current = startH * 60 + startM;
      const end = endH * 60 + endM;

      while (current + duration <= end) {
        const h = Math.floor(current / 60).toString().padStart(2, "0");
        const m = (current % 60).toString().padStart(2, "0");
        const slot = `${h}:${m}`;
        if (!bookedTimes.has(slot)) slots.push(slot);
        current += 30; // 30-min increments
      }

      return { slots, isBlocked: false };
    }),

  // Public: create booking
  create: publicProcedure
    .input(
      z.object({
        callTypeId: z.number(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        message: z.string().optional(),
        scheduledDate: z.string(),
        scheduledTime: z.string(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Create or find lead
      const existingLeads = await db.getLeads();
      const existing = existingLeads.find((l) => l.email === input.email);
      let leadId: number | undefined;

      if (!existing) {
        await db.createLead({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          company: input.company,
          source: "booking",
          stage: "new_lead",
          offerInterest: "unknown",
        });
        const newLeads = await db.getLeads();
        const newLead = newLeads.find((l) => l.email === input.email);
        leadId = newLead?.id;
      } else {
        leadId = existing.id;
      }

      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await db.createBooking({
        ...input,
        leadId,
        status: "pending",
        confirmationToken: token,
        timezone: input.timezone ?? "America/Los_Angeles",
      });

      if (leadId) {
        await db.addInteraction({
          leadId,
          type: "booking",
          title: `Booked: ${input.scheduledDate} at ${input.scheduledTime}`,
          body: input.message,
        });
      }

      await notifyOwner({
        title: `New Booking: ${input.firstName} ${input.lastName}`,
        content: `${input.email} booked on ${input.scheduledDate} at ${input.scheduledTime}. Company: ${input.company ?? "N/A"}`,
      }).catch(() => {});

      return { success: true, token };
    }),

  // Admin: list bookings
  list: adminProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(({ input }) => db.getBookings(input.status)),

  // Admin: update booking status
  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "cancelled", "completed"]), adminNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      await db.updateBooking(input.id, { status: input.status, adminNotes: input.adminNotes });
      return { success: true };
    }),

  // Admin: availability management
  getAvailability: adminProcedure.query(() => db.getAvailability()),

  setAvailability: adminProcedure
    .input(
      z.array(
        z.object({
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string(),
          endTime: z.string(),
          isActive: z.boolean(),
        })
      )
    )
    .mutation(async ({ input }) => {
      for (const slot of input) {
        await db.upsertAvailability(slot.dayOfWeek, slot.startTime, slot.endTime, slot.isActive);
      }
      return { success: true };
    }),

  // Admin: blocked dates
  getBlockedDates: adminProcedure.query(() => db.getBlockedDates()),
  addBlockedDate: adminProcedure
    .input(z.object({ date: z.string(), reason: z.string().optional() }))
    .mutation(({ input }) => db.addBlockedDate(input.date, input.reason)),
  removeBlockedDate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.removeBlockedDate(input.id)),
});

// ─── Email capture ────────────────────────────────────────────────────────────
const captureRouter = router({
  bookDownload: publicProcedure
    .input(z.object({ email: z.string().email(), firstName: z.string().optional() }))
    .mutation(async ({ input }) => {
      await db.captureEmail(input.email, input.firstName, "book_download");
      // Also create a lead
      const existing = (await db.getLeads()).find((l) => l.email === input.email);
      if (!existing) {
        await db.createLead({
          firstName: input.firstName ?? "",
          lastName: "",
          email: input.email,
          source: "book_download",
          stage: "new_lead",
          offerInterest: "unknown",
        });
      }
      await notifyOwner({
        title: `Book Download: ${input.email}`,
        content: `${input.firstName ?? "Someone"} downloaded the free chapter.`,
      }).catch(() => {});
      return { success: true };
    }),

  list: adminProcedure.query(() => db.getEmailCaptures()),
});

// ─── Analytics ────────────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: adminProcedure.query(() => db.getAnalyticsSummary()),
});

// ─── App router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  lead: leadRouter,
  booking: bookingRouter,
  capture: captureRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
