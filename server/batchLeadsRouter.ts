/**
 * POST /api/leads/batch
 *
 * Bulk-import leads into the CRM without requiring a browser session.
 * Secured with a static API key sent as the `X-API-Key` request header.
 *
 * Request body: JSON array of lead objects (see LeadInput schema below).
 * Response: { imported: number, skipped: number, results: Array<{email, status, error?}> }
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";

export const batchLeadsRouter = Router();

// ─── Input schema ─────────────────────────────────────────────────────────────
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

// ─── POST /api/leads/batch ────────────────────────────────────────────────────
batchLeadsRouter.post("/api/leads/batch", requireApiKey, async (req: Request, res: Response) => {
  // Parse & validate body
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
      // Duplicate email (unique constraint) is a soft skip, not a hard error
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

// ─── GET /api/leads/batch (health check) ──────────────────────────────────────
batchLeadsRouter.get("/api/leads/batch", requireApiKey, (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Batch leads endpoint is live. Use POST to import leads." });
});
