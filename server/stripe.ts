import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

// Pricing catalogue — single source of truth
// Prices are in cents (USD)
export const CALL_TYPE_PRICES: Record<string, { priceCents: number; name: string; description: string }> = {
  "exploratory-call": {
    priceCents: 0,
    name: "Exploratory Call",
    description: "30-minute complimentary discovery call",
  },
  "paid-consultation": {
    priceCents: 50000, // $500
    name: "Paid Consultation",
    description: "60-minute deep-dive technical consultation",
  },
  "architecture-sprint": {
    priceCents: 1500000, // $15,000
    name: "3-day Architecture Sprint",
    description: "Weekend intensive to fix your infrastructure bottleneck",
  },
  "advisory-session": {
    priceCents: 100000, // $1,000
    name: "Advisory Session",
    description: "90-minute fractional CTO strategy session",
  },
};
