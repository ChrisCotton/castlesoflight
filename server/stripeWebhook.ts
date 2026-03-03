import { Router, Request, Response } from "express";
import { stripe } from "./stripe";
import { getDb } from "./db";
import { bookings, callTypes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendClientConfirmation, sendAdminLeadAlert } from "./email";

export const stripeWebhookRouter = Router();

// MUST use express.raw before express.json — registered in index.ts before the json middleware
stripeWebhookRouter.post(
  "/api/stripe/webhook",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Stripe Webhook] Signature verification failed:", message);
      return res.status(400).json({ error: `Webhook Error: ${message}` });
    }

    // Handle test events (verification ping from Stripe dashboard)
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

    const db = await getDb();
    if (!db) {
      console.error("[Stripe Webhook] Database not available");
      return res.status(500).json({ error: "Database unavailable" });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as {
            id: string;
            payment_intent: string | null;
            payment_status: string;
            metadata?: Record<string, string>;
            customer_email?: string | null;
          };

          const bookingId = session.metadata?.booking_id
            ? parseInt(session.metadata.booking_id)
            : null;

          if (bookingId) {
            await db
              .update(bookings)
              .set({
                paymentStatus: "paid",
                status: "confirmed",
                stripeSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : null,
              })
              .where(eq(bookings.id, bookingId));

            // Fetch full booking + call type for email
            const bookingRows = await db
              .select()
              .from(bookings)
              .where(eq(bookings.id, bookingId))
              .limit(1);
            const booking = bookingRows[0];

            if (booking) {
              const ctRows = await db
                .select()
                .from(callTypes)
                .where(eq(callTypes.id, booking.callTypeId))
                .limit(1);
              const ct = ctRows[0];

              if (ct) {
                const emailData = {
                  firstName: booking.firstName,
                  lastName: booking.lastName,
                  email: booking.email,
                  company: booking.company,
                  phone: booking.phone,
                  message: booking.message,
                  callTypeName: ct.name,
                  durationMinutes: ct.durationMinutes,
                  scheduledDate: booking.scheduledDate,
                  scheduledTime: booking.scheduledTime,
                  timezone: booking.timezone,
                  priceCents: booking.priceCents,
                  paymentStatus: "paid",
                  bookingId,
                };
                // Send confirmation to client and alert to admin (non-blocking)
                sendClientConfirmation(emailData).catch((err) =>
                  console.error("[Stripe Webhook] Client confirmation email failed:", err)
                );
                sendAdminLeadAlert(emailData).catch((err) =>
                  console.error("[Stripe Webhook] Admin lead alert email failed:", err)
                );
              }
            }

            await notifyOwner({
              title: `💰 Payment Received — Booking #${bookingId}`,
              content: `Stripe session ${session.id} completed. Booking confirmed. Emails sent.`,
            }).catch(() => {});
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as {
            id: string;
            metadata?: Record<string, string>;
          };
          const bookingId = session.metadata?.booking_id
            ? parseInt(session.metadata.booking_id)
            : null;
          if (bookingId) {
            await db
              .update(bookings)
              .set({ paymentStatus: "failed", status: "cancelled" })
              .where(eq(bookings.id, bookingId));
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const pi = event.data.object as { id: string };
          await db
            .update(bookings)
            .set({ paymentStatus: "failed" })
            .where(eq(bookings.stripePaymentIntentId, pi.id));
          break;
        }

        default:
          // Unhandled event type — safe to ignore
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("[Stripe Webhook] Handler error:", err);
      return res.status(500).json({ error: "Internal handler error" });
    }
  }
);
