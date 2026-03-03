/**
 * Tests for POST /api/leads/batch
 * Validates API key auth, Zod schema enforcement, and per-lead result reporting.
 * Uses a mock db.createLead to avoid real DB calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { batchLeadsRouter } from "./batchLeadsRouter";

// ─── Mock the db module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createLead: vi.fn(),
}));

import * as db from "./db";

// ─── Test app setup ────────────────────────────────────────────────────────────
function buildApp(apiKey: string) {
  process.env.CRM_API_KEY = apiKey;
  const app = express();
  app.use(express.json());
  app.use(batchLeadsRouter);
  return app;
}

const VALID_KEY = "test-secret-key-abc123";

const validLead = {
  firstName: "Guillaume",
  lastName: "Poncin",
  email: "gponcin@alchemy.com",
  company: "Alchemy",
  jobTitle: "CTO",
  linkedIn: "https://linkedin.com/in/guillaume-poncin-012611",
  source: "linkedin",
  offerInterest: "sprint",
  notes: "Ex-Stripe, ex-Google. Hiring Engineering Manager for Platform.",
  tags: ["fintech", "web3", "high-value"],
};

describe("POST /api/leads/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when X-API-Key header is missing", async () => {
    const app = buildApp(VALID_KEY);
    const res = await request(app).post("/api/leads/batch").send([validLead]);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  it("returns 401 when X-API-Key header is wrong", async () => {
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", "wrong-key")
      .send([validLead]);
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is not an array", async () => {
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send({ firstName: "Test" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("returns 400 when a lead is missing required fields", async () => {
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send([{ firstName: "NoEmail" }]);
    expect(res.status).toBe(400);
  });

  it("imports a single valid lead successfully", async () => {
    vi.mocked(db.createLead).mockResolvedValueOnce(undefined as never);
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send([validLead]);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(0);
    expect(res.body.results[0].status).toBe("imported");
    expect(res.body.results[0].email).toBe("gponcin@alchemy.com");
  });

  it("imports multiple leads and reports per-lead results", async () => {
    vi.mocked(db.createLead)
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never);
    const app = buildApp(VALID_KEY);
    const leads = [
      validLead,
      { ...validLead, email: "arulk@circle.com", firstName: "Arul", lastName: "Kumaravel" },
    ];
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send(leads);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(2);
    expect(res.body.total).toBe(2);
  });

  it("reports error for a lead that throws a DB error without stopping others", async () => {
    vi.mocked(db.createLead)
      .mockRejectedValueOnce(new Error("DB connection failed"))
      .mockResolvedValueOnce(undefined as never);
    const app = buildApp(VALID_KEY);
    const leads = [
      validLead,
      { ...validLead, email: "arulk@circle.com", firstName: "Arul", lastName: "Kumaravel" },
    ];
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send(leads);
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(1);
    expect(res.body.results[0].status).toBe("error");
    expect(res.body.results[1].status).toBe("imported");
  });

  it("marks duplicate email errors as soft skips", async () => {
    vi.mocked(db.createLead).mockRejectedValueOnce(
      new Error("Duplicate entry for key 'email'")
    );
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send([validLead]);
    expect(res.status).toBe(200);
    expect(res.body.results[0].error).toMatch(/duplicate/i);
  });

  it("defaults source to linkedin and stage to new_lead when omitted", async () => {
    vi.mocked(db.createLead).mockResolvedValueOnce(undefined as never);
    const app = buildApp(VALID_KEY);
    const minimalLead = { firstName: "Test", lastName: "User", email: "test@example.com" };
    const res = await request(app)
      .post("/api/leads/batch")
      .set("X-API-Key", VALID_KEY)
      .send([minimalLead]);
    expect(res.status).toBe(200);
    const call = vi.mocked(db.createLead).mock.calls[0][0];
    expect(call.source).toBe("linkedin");
    expect(call.stage).toBe("new_lead");
  });

  it("GET /api/leads/batch returns health check when key is valid", async () => {
    const app = buildApp(VALID_KEY);
    const res = await request(app)
      .get("/api/leads/batch")
      .set("X-API-Key", VALID_KEY);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
