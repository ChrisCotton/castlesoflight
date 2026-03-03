import { describe, it, expect, vi, beforeEach } from "vitest";
import { mergeTemplate } from "./emailTemplateRouter";

// ─── mergeTemplate unit tests ─────────────────────────────────────────────────
describe("mergeTemplate", () => {
  it("replaces a single variable", () => {
    const result = mergeTemplate("Hello {{firstName}}!", { firstName: "Sarah" });
    expect(result).toBe("Hello Sarah!");
  });

  it("replaces multiple variables", () => {
    const result = mergeTemplate(
      "Hi {{firstName}}, welcome to {{company}}.",
      { firstName: "Chris", company: "Castles of Light" }
    );
    expect(result).toBe("Hi Chris, welcome to Castles of Light.");
  });

  it("leaves unresolved variables as-is when key is missing", () => {
    const result = mergeTemplate("Hi {{firstName}}, your role is {{jobTitle}}.", {
      firstName: "Alex",
    });
    expect(result).toBe("Hi Alex, your role is {{jobTitle}}.");
  });

  it("replaces the same variable multiple times", () => {
    const result = mergeTemplate("{{name}} is great. {{name}} rocks.", { name: "Drizzle" });
    expect(result).toBe("Drizzle is great. Drizzle rocks.");
  });

  it("returns the template unchanged when no variables are provided", () => {
    const tpl = "No variables here.";
    expect(mergeTemplate(tpl, {})).toBe(tpl);
  });

  it("handles empty string values", () => {
    const result = mergeTemplate("Hello {{firstName}} {{lastName}}", {
      firstName: "",
      lastName: "Cotton",
    });
    expect(result).toBe("Hello  Cotton");
  });

  it("handles HTML content in the template", () => {
    const tpl = "<p>Hi <strong>{{firstName}}</strong>, your company is {{company}}.</p>";
    const result = mergeTemplate(tpl, { firstName: "Chris", company: "Castles of Light" });
    expect(result).toBe("<p>Hi <strong>Chris</strong>, your company is Castles of Light.</p>");
  });

  it("handles special characters in replacement values", () => {
    const result = mergeTemplate("Company: {{company}}", {
      company: "Smith & Jones <Partners>",
    });
    expect(result).toBe("Company: Smith & Jones <Partners>");
  });

  it("does not replace partial variable syntax", () => {
    const result = mergeTemplate("Hello {firstName} and {{lastName}}", {
      firstName: "Chris",
      lastName: "Cotton",
    });
    // Single-brace {firstName} should NOT be replaced
    expect(result).toBe("Hello {firstName} and Cotton");
  });
});

// ─── buildOutreachEmail unit tests ────────────────────────────────────────────
describe("buildOutreachEmail", () => {
  it("wraps body HTML in the HUD shell", async () => {
    const { buildOutreachEmail } = await import("./emailOutreach");
    const body = "<p>Hello world</p>";
    const result = buildOutreachEmail(body);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain(body);
    expect(result).toContain("CASTLES OF LIGHT");
    expect(result).toContain("castlesoflight.com");
  });

  it("includes the injected body HTML verbatim", async () => {
    const { buildOutreachEmail } = await import("./emailOutreach");
    const body = "<p>Custom <strong>content</strong> here</p>";
    const result = buildOutreachEmail(body);
    expect(result).toContain(body);
  });

  it("produces valid HTML structure", async () => {
    const { buildOutreachEmail } = await import("./emailOutreach");
    const result = buildOutreachEmail("<p>Test</p>");
    expect(result).toContain("<html");
    expect(result).toContain("</html>");
    expect(result).toContain("<body");
    expect(result).toContain("</body>");
  });
});
