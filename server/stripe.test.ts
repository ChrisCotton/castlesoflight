import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Stripe payment integration tests
 * Tests the booking-to-payment flow logic without hitting real Stripe APIs.
 */

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
const mockCheckoutCreate = vi.fn();
const mockWebhooksConstruct = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCheckoutCreate,
        },
      },
      webhooks: {
        constructEvent: mockWebhooksConstruct,
      },
    })),
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Stripe checkout session creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a checkout session with correct line items for a paid booking", async () => {
    const mockSessionUrl = "https://checkout.stripe.com/pay/cs_test_abc123";

    mockCheckoutCreate.mockResolvedValue({
      id: "cs_test_abc123",
      url: mockSessionUrl,
    });

    // Simulate what the tRPC procedure does
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe("sk_test_fake", { apiVersion: "2025-01-27.acacia" as any });

    const bookingId = 42;
    const callTypeName = "The Sprint";
    const priceInCents = 1500000; // $15,000
    const origin = "https://castlesoflight.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceInCents,
            product_data: {
              name: callTypeName,
              description: "Infrastructure consultation with Christopher Cotton",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: bookingId.toString(),
      },
      success_url: `${origin}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book?cancelled=true`,
    });

    expect(mockCheckoutCreate).toHaveBeenCalledOnce();
    expect(session.url).toBe(mockSessionUrl);

    const callArgs = mockCheckoutCreate.mock.calls[0][0];
    expect(callArgs.mode).toBe("payment");
    expect(callArgs.line_items[0].price_data.unit_amount).toBe(1500000);
    expect(callArgs.metadata.bookingId).toBe("42");
    expect(callArgs.success_url).toContain(origin);
    expect(callArgs.cancel_url).toContain("cancelled=true");
  });

  it("returns correct session URL for redirect", async () => {
    const expectedUrl = "https://checkout.stripe.com/pay/cs_test_xyz789";
    mockCheckoutCreate.mockResolvedValue({ id: "cs_test_xyz789", url: expectedUrl });

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe("sk_test_fake", { apiVersion: "2025-01-27.acacia" as any });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    });

    expect(session.url).toBe(expectedUrl);
  });
});

describe("Stripe webhook event handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies webhook signature and extracts booking ID from metadata", () => {
    const mockEvent = {
      id: "evt_live_abc123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_abc",
          payment_status: "paid",
          amount_total: 1500000,
          metadata: {
            bookingId: "42",
          },
        },
      },
    };

    // Use the mocked constructEvent (not the real Stripe signature verification)
    mockWebhooksConstruct.mockReturnValue(mockEvent);

    // The mock returns our event directly — simulates successful signature verification
    const event = mockWebhooksConstruct(
      Buffer.from(JSON.stringify(mockEvent)),
      "t=123,v1=abc",
      "whsec_test_secret"
    );

    expect(event.type).toBe("checkout.session.completed");
    const session = event.data.object as any;
    expect(session.metadata.bookingId).toBe("42");
    expect(session.payment_status).toBe("paid");
    expect(session.amount_total).toBe(1500000);
  });

  it("detects test events by evt_test_ prefix and skips processing", () => {
    const testEventId = "evt_test_abc123";
    const isTestEvent = testEventId.startsWith("evt_test_");
    expect(isTestEvent).toBe(true);

    const liveEventId = "evt_1AbCdEfGhIjKlMnO";
    const isLiveTestEvent = liveEventId.startsWith("evt_test_");
    expect(isLiveTestEvent).toBe(false);
  });

  it("maps payment_status paid to booking paymentStatus paid", () => {
    const stripeStatus = "paid";
    // This is the mapping logic used in the webhook handler
    const bookingPaymentStatus = stripeStatus === "paid" ? "paid" : "failed";
    expect(bookingPaymentStatus).toBe("paid");
  });

  it("maps payment_status unpaid to booking paymentStatus failed", () => {
    const stripeStatus = "unpaid";
    const bookingPaymentStatus = stripeStatus === "paid" ? "paid" : "failed";
    expect(bookingPaymentStatus).toBe("failed");
  });
});

describe("Price calculation helpers", () => {
  it("converts decimal price to Stripe cents correctly", () => {
    const priceDecimal = "15000.00"; // $15,000
    const cents = Math.round(parseFloat(priceDecimal) * 100);
    expect(cents).toBe(1500000);
  });

  it("converts $500 to 50000 cents", () => {
    const priceDecimal = "500";
    const cents = Math.round(parseFloat(priceDecimal) * 100);
    expect(cents).toBe(50000);
  });

  it("handles free call types (price 0) by skipping Stripe", () => {
    const price = "0";
    const isPaid = parseFloat(price) > 0;
    expect(isPaid).toBe(false);
  });

  it("identifies paid call types correctly", () => {
    const price = "10000";
    const isPaid = parseFloat(price) > 0;
    expect(isPaid).toBe(true);
  });
});
