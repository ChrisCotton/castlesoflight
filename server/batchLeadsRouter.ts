/**
 * Agent REST API — secured with X-API-Key: CRM_API_KEY
 *
 * Endpoints:
 *   GET  /api/leads              — list all active leads (agents: SCOUT, HERALD, TRACKER, KEEPER)
 *   GET  /api/leads/:id          — get single lead + interaction timeline
 *   POST /api/leads/batch        — bulk-import leads (SCOUT)
 *   PATCH /api/leads/:id         — update stage / notes / lastContactedAt (HERALD, TRACKER)
 *   POST /api/leads/:id/interactions — add a timeline event (HERALD, CLOSER)
 *   GET  /api/leads/batch        — health check
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";

export const batchLeadsRouter = Router();

// ─── API key middleware ────────────────────────────────────────────────────────
function requireApiKey(req: Request, res: Response, next: () => void) {
  const key = req.headers["x-api-key"];
  const expected = process.env.CRM_API_KEY;

  if (!expected) {
    res.status(500).json({ error: "CRM_API_KEY is not configured on the server." });
    return;
  }
  if (!key || key !== expected) {
    res.status(401).json({ error: "Unauthorized: invalid or missing X-API-Key header." });
    return;
  }
  next();
}

// ─── Input schemas ────────────────────────────────────────────────────────────
const LeadInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  website: z.string().optional(),
  linkedIn: z.string().optional(),
  stage: z
    .enum(["new_lead", "contacted", "qualified", "proposal_sent", "closed_won", "closed_lost"])
    .optional()
    .default("new_lead"),
  source: z
    .enum(["website_contact", "book_download", "booking", "referral", "linkedin", "other"])
    .optional()
    .default("linkedin"),
  dealValue: z.string().optional(),
  offerInterest: z.enum(["sprint", "advisory", "both", "unknown"]).optional().default("unknown"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const BatchBody = z.array(LeadInput).min(1).max(100);

const LeadUpdateInput = z.object({
  stage: z
    .enum(["new_lead", "contacted", "qualified", "proposal_sent", "closed_won", "closed_lost"])
    .optional(),
  notes: z.string().optional(),
  dealValue: z.string().optional(),
  offerInterest: z.enum(["sprint", "advisory", "both", "unknown"]).optional(),
  lastContactedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

const InteractionInput = z.object({
  type: z.enum(["note", "email", "call", "meeting", "booking", "stage_change", "system"]),
  title: z.string().min(1),
  body: z.string().optional(),
});

// ─── GET /api/leads/batch (health check) — MUST be before /api/leads/:id ────
batchLeadsRouter.get("/api/leads/batch", requireApiKey, (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Agent CRM API is live. Endpoints: GET /api/leads, GET /api/leads/:id, POST /api/leads/batch, PATCH /api/leads/:id, POST /api/leads/:id/interactions" });
});

// ─── GET /api/leads ───────────────────────────────────────────────────────────
// Returns all active (non-archived) leads. Agents use this to check for
// duplicates (SCOUT) and pull the outreach queue (HERALD, TRACKER, KEEPER).
batchLeadsRouter.get("/api/leads", requireApiKey, async (_req: Request, res: Response) => {
  try {
    const allLeads = await db.getLeads(false);
    res.json({ leads: allLeads, total: allLeads.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────
// Returns a single lead with its full interaction timeline.
batchLeadsRouter.get("/api/leads/:id", requireApiKey, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead id." });
    return;
  }
  try {
    const lead = await db.getLeadById(id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found." });
      return;
    }
    const timeline = await db.getLeadInteractions(id);
    res.json({ lead, timeline });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── PATCH /api/leads/:id ─────────────────────────────────────────────────────
// Allows agents to update lead stage, notes, or lastContactedAt.
// HERALD uses this after sending an email; TRACKER uses it to flag stale leads.
batchLeadsRouter.patch("/api/leads/:id", requireApiKey, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead id." });
    return;
  }
  const parsed = LeadUpdateInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }
  try {
    const existing = await db.getLeadById(id);
    if (!existing) {
      res.status(404).json({ error: "Lead not found." });
      return;
    }
    const update: Parameters<typeof db.updateLead>[1] = {};
    if (parsed.data.stage !== undefined) update.stage = parsed.data.stage;
    if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
    if (parsed.data.dealValue !== undefined) update.dealValue = parsed.data.dealValue;
    if (parsed.data.offerInterest !== undefined) update.offerInterest = parsed.data.offerInterest;
    if (parsed.data.lastContactedAt !== undefined) update.lastContactedAt = new Date(parsed.data.lastContactedAt);
    if (parsed.data.tags !== undefined) update.tags = parsed.data.tags;
    if (parsed.data.isArchived !== undefined) update.isArchived = parsed.data.isArchived;

    // Auto-log stage changes to the interaction timeline
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      await db.addInteraction({
        leadId: id,
        type: "stage_change",
        title: `Stage changed: ${existing.stage} → ${parsed.data.stage}`,
        metadata: { from: existing.stage, to: parsed.data.stage, agent: req.headers["x-agent-id"] ?? "api" },
      });
    }

    await db.updateLead(id, update);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── POST /api/leads/:id/interactions ─────────────────────────────────────────
// Agents log activity to the lead timeline (emails sent, calls made, notes).
batchLeadsRouter.post("/api/leads/:id/interactions", requireApiKey, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid lead id." });
    return;
  }
  const parsed = InteractionInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }
  try {
    const lead = await db.getLeadById(id);
    if (!lead) {
      res.status(404).json({ error: "Lead not found." });
      return;
    }
    await db.addInteraction({ leadId: id, ...parsed.data });
    // Update lastContactedAt for email/call/meeting interactions
    if (["email", "call", "meeting"].includes(parsed.data.type)) {
      await db.updateLead(id, { lastContactedAt: new Date() });
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── POST /api/leads/batch ────────────────────────────────────────────────────
// Bulk-import leads from SCOUT (Apollo.io results). Must be before /:id routes.
batchLeadsRouter.post("/api/leads/batch", requireApiKey, async (req: Request, res: Response) => {
  const parsed = BatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const leads = parsed.data;
  const results: { email: string; status: "imported" | "error"; error?: string }[] = [];
  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    try {
      await db.createLead({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone ?? null,
        company: lead.company ?? null,
        jobTitle: lead.jobTitle ?? null,
        website: lead.website ?? null,
        linkedIn: lead.linkedIn ?? null,
        stage: lead.stage,
        source: lead.source,
        dealValue: lead.dealValue ?? null,
        offerInterest: lead.offerInterest,
        notes: lead.notes ?? null,
        tags: lead.tags,
      });
      results.push({ email: lead.email, status: "imported" });
      imported++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isDuplicate =
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("unique");
      results.push({
        email: lead.email,
        status: "error",
        error: isDuplicate ? "Duplicate email — lead already exists" : message,
      });
      skipped++;
    }
  }

  res.json({
    imported,
    skipped,
    total: leads.length,
    results,
  });
});


