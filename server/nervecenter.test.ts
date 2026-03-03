import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
  createLead: vi.fn().mockResolvedValue({}),
  updateLead: vi.fn().mockResolvedValue({}),
  getLeadInteractions: vi.fn().mockResolvedValue([]),
  addInteraction: vi.fn().mockResolvedValue({}),
  getCallTypes: vi.fn().mockResolvedValue([
    { id: 1, name: "Exploratory Call", slug: "exploratory", durationMinutes: 30, price: 0, isActive: true, sortOrder: 1, description: null, color: null },
    { id: 2, name: "The Sprint", slug: "sprint", durationMinutes: 120, price: 15000, isActive: true, sortOrder: 2, description: null, color: null },
  ]),
  getAvailability: vi.fn().mockResolvedValue([
    { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true },
  ]),
  getBlockedDates: vi.fn().mockResolvedValue([]),
  getBookedSlots: vi.fn().mockResolvedValue([]),
  getBookings: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn().mockResolvedValue({}),
  updateBooking: vi.fn().mockResolvedValue({}),
  upsertAvailability: vi.fn().mockResolvedValue({}),
  addBlockedDate: vi.fn().mockResolvedValue({}),
  removeBlockedDate: vi.fn().mockResolvedValue({}),
  captureEmail: vi.fn().mockResolvedValue({}),
  getEmailCaptures: vi.fn().mockResolvedValue([]),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    leadCounts: [{ stage: "new_lead", count: 3 }, { stage: "closed_won", count: 1 }],
    bookingCounts: [{ status: "pending", count: 2 }],
    emailCaptureCount: [{ count: 5 }],
    pipelineValue: [{ total: 25000 }],
  }),
  upsertUser: vi.fn().mockResolvedValue({}),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Christopher Cotton",
      email: "chris@castlesoflight.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      name: "Regular User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result?.role).toBe("admin");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Public lead capture ──────────────────────────────────────────────────────
describe("lead.submitContact (public)", () => {
  it("accepts a valid contact form submission", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.lead.submitContact({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      company: "Acme Corp",
      offerInterest: "sprint",
      source: "website_contact",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.lead.submitContact({ firstName: "Jane", lastName: "Doe", email: "not-an-email" })
    ).rejects.toThrow();
  });
});

// ─── Admin lead management ────────────────────────────────────────────────────
describe("lead (admin)", () => {
  it("list requires admin role", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.lead.list({ includeArchived: false })).rejects.toThrow();
  });

  it("list returns leads for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.lead.list({ includeArchived: false });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get throws NOT_FOUND for missing lead", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(caller.lead.get({ id: 9999 })).rejects.toThrow();
  });

  it("create adds a lead", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.lead.create({
      firstName: "John",
      lastName: "Smith",
      email: "john@smith.com",
      stage: "qualified",
      offerInterest: "advisory",
      dealValue: "10000",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Booking (public) ─────────────────────────────────────────────────────────
describe("booking (public)", () => {
  it("getCallTypes returns active call types", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.booking.getCallTypes();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("getAvailableSlots returns time slots for an available day", async () => {
    // Find next Monday
    const today = new Date();
    const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const dateStr = nextMonday.toISOString().split("T")[0];

    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.booking.getAvailableSlots({ date: dateStr, callTypeId: 1 });
    expect(result).toHaveProperty("slots");
    expect(result).toHaveProperty("isBlocked");
  });

  it("create booking succeeds with valid data", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.booking.create({
      callTypeId: 1,
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alice@example.com",
      scheduledDate: "2026-04-01",
      scheduledTime: "10:00",
    });
    expect(result.success).toBe(true);
    expect(result.token).toBeTruthy();
  });
});

// ─── Booking (admin) ──────────────────────────────────────────────────────────
describe("booking (admin)", () => {
  it("list requires admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.booking.list({})).rejects.toThrow();
  });

  it("list returns bookings for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.booking.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("updateStatus changes booking status", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.booking.updateStatus({ id: 1, status: "confirmed" });
    expect(result.success).toBe(true);
  });
});

// ─── Analytics ────────────────────────────────────────────────────────────────
describe("analytics", () => {
  it("summary requires admin", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.analytics.summary()).rejects.toThrow();
  });

  it("summary returns pipeline data for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.analytics.summary();
    expect(result).toHaveProperty("leadCounts");
    expect(result).toHaveProperty("bookingCounts");
    expect(result).toHaveProperty("pipelineValue");
    expect(result?.leadCounts.length).toBeGreaterThan(0);
  });
});

// ─── Email capture ────────────────────────────────────────────────────────────
describe("capture.bookDownload (public)", () => {
  it("accepts valid email for book download", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.capture.bookDownload({ email: "reader@example.com", firstName: "Bob" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.capture.bookDownload({ email: "bad-email" })).rejects.toThrow();
  });
});
