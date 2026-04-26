import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { stripe } from "./stripe";
import { emailTemplateRouter } from "./emailTemplateRouter";
import { blogRouter } from "./blogRouter";
import { authRouter } from "./authRouter";
import { sendClientConfirmation, sendAdminLeadAlert, sendAdminNewLeadAlert, sendNewsletterWelcome, sendNewsletterBroadcast } from "./email";

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
      // Fire admin lead alert email (non-blocking)
      sendAdminNewLeadAlert({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        company: input.company,
        message: input.message,
        source: "Contact Form",
      }).catch((err) => console.error("[Email] Admin new lead alert failed:", err));
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

      // Retrieve the newly created booking to get its ID
      const allBookings = await db.getBookings();
      const newBooking = allBookings.find((b) => b.confirmationToken === token);

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

      // Fetch call type for email data
      const callTypes = await db.getCallTypes(true);
      const callType = callTypes.find((ct) => ct.id === input.callTypeId);
      const isPaidCallType = parseFloat(callType?.price ?? "0") > 0;

      // For FREE call types: send confirmation emails immediately
      // For PAID call types: emails are sent after Stripe webhook confirms payment
      if (!isPaidCallType && callType) {
        const emailData = {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          company: input.company,
          phone: input.phone,
          message: input.message,
          callTypeName: callType.name,
          durationMinutes: callType.durationMinutes,
          scheduledDate: input.scheduledDate,
          scheduledTime: input.scheduledTime,
          timezone: input.timezone,
          priceCents: 0,
          paymentStatus: "free",
          bookingId: newBooking?.id,
        };
        // Send both emails non-blocking
        sendClientConfirmation(emailData).catch((err) =>
          console.error("[Email] Client confirmation failed:", err)
        );
        sendAdminLeadAlert(emailData).catch((err) =>
          console.error("[Email] Admin lead alert failed:", err)
        );
      }

      return { success: true, token, bookingId: newBooking?.id };
    }),

  // Public: create Stripe checkout session for a paid booking
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        bookingId: z.number(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });

      const callTypes = await db.getCallTypes(true);
      const callType = callTypes.find((ct) => ct.id === booking.callTypeId);
      if (!callType) throw new TRPCError({ code: "NOT_FOUND", message: "Call type not found" });

      const priceCents = Math.round(parseFloat(callType.price ?? "0") * 100);
      if (priceCents === 0) {
        // Free call — confirm immediately
        await db.updateBooking(input.bookingId, { status: "confirmed", paymentStatus: "free" });
        return { url: `${input.origin}/book/success?token=${booking.confirmationToken}&free=1` };
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: booking.email,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: callType.currency?.toLowerCase() ?? "usd",
              product_data: {
                name: callType.name,
                description: `${callType.durationMinutes}-minute session on ${booking.scheduledDate} at ${booking.scheduledTime}`,
              },
              unit_amount: priceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          booking_id: input.bookingId.toString(),
          customer_email: booking.email,
          customer_name: `${booking.firstName} ${booking.lastName}`,
        },
        client_reference_id: input.bookingId.toString(),
        success_url: `${input.origin}/book/success?token=${booking.confirmationToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/book/cancel?booking_id=${input.bookingId}`,
      });

      // Update booking with session id and pending payment status
      await db.updateBooking(input.bookingId, {
        stripeSessionId: session.id,
        paymentStatus: "pending",
        priceCents,
      });

      // For free calls that bypass Stripe, send emails immediately
      if (priceCents === 0) {
        const emailData = {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          company: booking.company,
          phone: booking.phone,
          message: booking.message,
          callTypeName: callType.name,
          durationMinutes: callType.durationMinutes,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          timezone: booking.timezone,
          priceCents: 0,
          paymentStatus: "free",
          bookingId: input.bookingId,
        };
        sendClientConfirmation(emailData).catch((err) =>
          console.error("[Email] Client confirmation failed:", err)
        );
        sendAdminLeadAlert(emailData).catch((err) =>
          console.error("[Email] Admin lead alert failed:", err)
        );
      }

      return { url: session.url! };
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
      // Fire admin new lead alert for book download (non-blocking)
      if (!existing) {
        sendAdminNewLeadAlert({
          firstName: input.firstName ?? "Reader",
          email: input.email,
          source: "Book Download (Free Chapter)",
        }).catch((err) => console.error("[Email] Book download lead alert failed:", err));
      }
      return { success: true };
    }),

  list: adminProcedure.query(() => db.getEmailCaptures()),
});

// ─── Newsletter ───────────────────────────────────────────────────────────────
const newsletterRouter = router({
  // Public: subscribe
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        source: z.enum(["landing_page", "book_download", "booking", "contact_form", "manual", "other"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.subscribeToNewsletter(
        input.email,
        input.firstName,
        input.lastName,
        input.source ?? "landing_page"
      );
      // Send welcome email only to new subscribers
      if (result.isNew && result.subscriber) {
        sendNewsletterWelcome({
          firstName: result.subscriber.firstName ?? undefined,
          email: result.subscriber.email,
          unsubscribeToken: result.subscriber.unsubscribeToken,
        }).catch((err) => console.error("[Email] Newsletter welcome failed:", err));
      }
      return { success: true, isNew: result.isNew };
    }),

  // Public: unsubscribe via token
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const ok = await db.unsubscribeFromNewsletter(input.token);
      return { success: ok };
    }),

  // Admin: list subscribers
  listSubscribers: adminProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(({ input }) => db.getNewsletterSubscribers(input.status)),

  // Admin: subscriber count
  subscriberCount: adminProcedure.query(() => db.getActiveSubscriberCount()),

  // Admin: list issues
  listIssues: adminProcedure.query(() => db.getNewsletterIssues()),

  // Admin: get single issue
  getIssue: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getNewsletterIssueById(input.id)),

  // Admin: create draft
  createIssue: adminProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        previewText: z.string().optional(),
        htmlBody: z.string().min(1),
        textBody: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const issue = await db.createNewsletterIssue({
        subject: input.subject,
        previewText: input.previewText,
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        status: "draft",
      });
      return issue;
    }),

  // Admin: update draft
  updateIssue: adminProcedure
    .input(
      z.object({
        id: z.number(),
        subject: z.string().min(1).optional(),
        previewText: z.string().optional(),
        htmlBody: z.string().optional(),
        textBody: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNewsletterIssue(id, data);
      return { success: true };
    }),

  // Admin: send broadcast
  sendIssue: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const issue = await db.getNewsletterIssueById(input.id);
      if (!issue) throw new TRPCError({ code: "NOT_FOUND", message: "Issue not found" });
      if (issue.status === "sent") throw new TRPCError({ code: "BAD_REQUEST", message: "Issue already sent" });

      const subscribers = await db.getNewsletterSubscribers("active");
      if (subscribers.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscribers" });
      }

      // Mark as sent immediately to prevent double-sends
      await db.updateNewsletterIssue(input.id, {
        status: "sent",
        sentAt: new Date(),
        recipientCount: subscribers.length,
      });

      // Send broadcast (non-blocking — returns stats)
      const stats = await sendNewsletterBroadcast(
        subscribers.map((s) => ({
          email: s.email,
          firstName: s.firstName,
          unsubscribeToken: s.unsubscribeToken,
        })),
        {
          subject: issue.subject,
          htmlBody: issue.htmlBody,
          previewText: issue.previewText,
        }
      );

      return { success: true, sent: stats.sent, failed: stats.failed };
    }),

  // Admin: delete subscriber
  deleteSubscriber: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db2 = await db.getDb();
      if (!db2) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { newsletterSubscribers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db2.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
      return { success: true };
    }),
});

// ─── Analytics ────────────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: adminProcedure.query(() => db.getAnalyticsSummary()),
  leadStats: adminProcedure.query(() => db.getLeadStats()),
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
    loginWithPassword: authRouter._def.procedures.loginWithPassword,
  }),
  lead: leadRouter,
  booking: bookingRouter,
  capture: captureRouter,
  analytics: analyticsRouter,
  newsletter: newsletterRouter,
  emailTemplate: emailTemplateRouter,
  blog: blogRouter,
});

export type AppRouter = typeof appRouter;
