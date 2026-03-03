import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Category enum ────────────────────────────────────────────────────────────
const TEMPLATE_CATEGORY = z.enum([
  "first_touch",
  "follow_up",
  "proposal",
  "closed_won",
  "re_engagement",
  "custom",
]);

// ─── Template merge helper ────────────────────────────────────────────────────
export function mergeTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Email Template Router ────────────────────────────────────────────────────
export const emailTemplateRouter = router({
  // List all templates ordered by category then name
  list: adminProcedure.query(() => db.listEmailTemplates()),

  // Get a single template by ID
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const t = await db.getEmailTemplateById(input.id);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      return t;
    }),

  // Create a new custom template
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        category: TEMPLATE_CATEGORY,
        subject: z.string().min(1).max(512),
        bodyHtml: z.string().min(1),
        variables: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createEmailTemplate({ ...input, isBuiltIn: false });
      return { id };
    }),

  // Update an existing template
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(256).optional(),
        category: TEMPLATE_CATEGORY.optional(),
        subject: z.string().min(1).max(512).optional(),
        bodyHtml: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existing = await db.getEmailTemplateById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await db.updateEmailTemplate(id, data);
      return { success: true };
    }),

  // Delete a custom template (built-ins are protected)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await db.getEmailTemplateById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.isBuiltIn) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Built-in templates cannot be deleted",
        });
      }
      await db.deleteEmailTemplate(input.id);
      return { success: true };
    }),

  // Preview: render template with lead data merged in
  preview: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        leadId: z.number().optional(),
      overrides: z.record(z.string(), z.string()).optional(),
    })
  )
  .query(async ({ input }) => {
      const template = await db.getEmailTemplateById(input.templateId);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });

      // Build variable map from lead fields
      const vars: Record<string, string> = {};
      if (input.leadId) {
        const lead = await db.getLeadById(input.leadId);
        if (lead) {
          vars.firstName = lead.firstName ?? "";
          vars.lastName = lead.lastName ?? "";
          vars.company = lead.company ?? "";
          vars.jobTitle = lead.jobTitle ?? "";
          vars.email = lead.email ?? "";
        }
      }
      // Overrides take precedence over auto-populated lead fields
      Object.assign(vars, input.overrides ?? {});

      const templateVars = (template.variables as string[]) ?? [];
      return {
        subject: mergeTemplate(template.subject, vars),
        bodyHtml: mergeTemplate(template.bodyHtml, vars),
        variables: templateVars,
        missingVars: templateVars.filter(
          (v) => !vars[v] || vars[v] === `{{${v}}}`
        ),
      };
    }),

  // Send outreach email to a lead using a template
  sendOutreach: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        leadId: z.number(),
      overrides: z.record(z.string(), z.string()).optional(),
    })
  )
  .mutation(async ({ input }) => {
      const [template, lead] = await Promise.all([
        db.getEmailTemplateById(input.templateId),
        db.getLeadById(input.leadId),
      ]);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      const vars: Record<string, string> = {
        firstName: lead.firstName ?? "",
        lastName: lead.lastName ?? "",
        company: lead.company ?? "",
        jobTitle: lead.jobTitle ?? "",
        email: lead.email ?? "",
        ...(input.overrides ?? {}),
      };

      const subject = mergeTemplate(template.subject, vars);
      const bodyHtml = mergeTemplate(template.bodyHtml, vars);

      // Wrap body in the cinematic HUD email shell
      const { buildOutreachEmail } = await import("./emailOutreach");
      const wrappedHtml = buildOutreachEmail(bodyHtml);

      // Send via Resend
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: "Christopher Cotton <bookings@castlesoflight.com>",
        to: lead.email,
        subject,
        html: wrappedHtml,
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Log the interaction on the lead timeline
      await db.addInteraction({
        leadId: lead.id,
        type: "email" as const,
        title: `Outreach sent: ${template.name}`,
        body: subject,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          subject,
        },
      });

      // Update lastContactedAt so the Stale column resets
      await db.updateLead(lead.id, { lastContactedAt: new Date() });

      return { success: true, subject, to: lead.email };
    }),

  // Seed the 5 built-in templates (idempotent)
  seedBuiltIns: adminProcedure.mutation(() => db.seedBuiltInTemplates()),
});
