import { describe, expect, it } from "vitest";
import {
  buildClientConfirmationEmail,
  buildAdminLeadAlertEmail,
  buildAdminNewLeadEmail,
  type BookingEmailData,
} from "./email";

// ─── Shared test data ─────────────────────────────────────────────────────────

const freeBooking: BookingEmailData = {
  firstName: "Sarah",
  lastName: "Chen",
  email: "sarah@techcorp.io",
  company: "TechCorp Inc.",
  phone: "+1 415 555 0100",
  message: "We need help cutting our AWS bill by 60%.",
  callTypeName: "Exploratory Call",
  durationMinutes: 30,
  scheduledDate: "2026-04-15",
  scheduledTime: "10:00",
  timezone: "America/Los_Angeles",
  priceCents: 0,
  paymentStatus: "free",
  bookingId: 101,
};

const paidBooking: BookingEmailData = {
  firstName: "Marcus",
  lastName: "Webb",
  email: "marcus@fintech.com",
  company: "FinTech Capital",
  phone: "+1 212 555 0200",
  message: "Need a 3-Day Infrastructure Sprint for our Series B launch.",
  callTypeName: "The Sprint",
  durationMinutes: 480,
  scheduledDate: "2026-04-20",
  scheduledTime: "09:00",
  timezone: "America/New_York",
  priceCents: 1500000, // $15,000
  paymentStatus: "paid",
  bookingId: 202,
};

const pendingPaidBooking: BookingEmailData = {
  ...paidBooking,
  paymentStatus: "pending",
  bookingId: 203,
};

// ─── Client Confirmation Email ────────────────────────────────────────────────

describe("buildClientConfirmationEmail", () => {
  it("renders valid HTML with DOCTYPE and body tags", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<body");
    expect(html).toContain("</html>");
  });

  it("includes the client's first name in the greeting", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("You're on the calendar, Sarah.");
  });

  it("includes the call type name", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("Exploratory Call");
  });

  it("shows 'Complimentary' for free bookings", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("Complimentary");
  });

  it("shows formatted price for paid bookings", () => {
    const html = buildClientConfirmationEmail(paidBooking);
    expect(html).toContain("$15,000");
  });

  it("shows 'Payment Confirmed' for paid bookings with paid status", () => {
    const html = buildClientConfirmationEmail(paidBooking);
    expect(html).toContain("✓ Payment Confirmed");
  });

  it("shows 'Awaiting Payment' for pending paid bookings", () => {
    const html = buildClientConfirmationEmail(pendingPaidBooking);
    expect(html).toContain("⏳ Awaiting Payment");
  });

  it("includes the scheduled date in human-readable format", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    // 2026-04-15 is a Wednesday
    expect(html).toContain("April");
    expect(html).toContain("2026");
  });

  it("includes the scheduled time in 12-hour format", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("10:00 AM PT");
  });

  it("includes the company name when provided", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("TechCorp Inc.");
  });

  it("includes the duration in minutes", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("30 minutes");
  });

  it("includes the castlesoflight.com CTA link", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("castlesoflight.com");
  });

  it("includes the SYS.ONLINE HUD header branding", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("SYS.ONLINE");
    expect(html).toContain("CASTLES OF LIGHT");
  });

  it("includes the 3-step 'What Happens Next' section", () => {
    const html = buildClientConfirmationEmail(freeBooking);
    expect(html).toContain("WHAT HAPPENS NEXT");
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("03");
  });
});

// ─── Admin Lead Alert Email ───────────────────────────────────────────────────

describe("buildAdminLeadAlertEmail", () => {
  it("renders valid HTML", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("shows PAID BOOKING label for paid bookings", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("💰 PAID BOOKING");
  });

  it("shows NEW BOOKING label for free bookings", () => {
    const html = buildAdminLeadAlertEmail(freeBooking);
    expect(html).toContain("📞 NEW BOOKING");
  });

  it("includes the lead's full name as the headline", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("Marcus Webb");
  });

  it("includes the lead's email as a mailto link", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("mailto:marcus@fintech.com");
    expect(html).toContain("marcus@fintech.com");
  });

  it("includes the lead's phone as a tel link", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("tel:+1 212 555 0200");
  });

  it("shows formatted price for paid bookings", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("$15,000");
  });

  it("shows 'Free / Exploratory' for free bookings", () => {
    const html = buildAdminLeadAlertEmail(freeBooking);
    expect(html).toContain("Free / Exploratory");
  });

  it("includes the client message in a styled quote block", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("Need a 3-Day Infrastructure Sprint");
  });

  it("includes a 'Reply to Lead' mailto CTA", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("Reply to Lead");
    expect(html).toContain("mailto:marcus@fintech.com");
  });

  it("includes a 'View in CRM' link to the admin dashboard", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("View in CRM");
    expect(html).toContain("/admin/bookings");
  });

  it("includes the company name", () => {
    const html = buildAdminLeadAlertEmail(paidBooking);
    expect(html).toContain("FinTech Capital");
  });

  it("does not show phone row when phone is not provided", () => {
    const noPhone: BookingEmailData = { ...freeBooking, phone: undefined };
    const html = buildAdminLeadAlertEmail(noPhone);
    // The phone detail row should not appear
    expect(html).not.toContain("tel:");
  });
});

// ─── Admin New Lead Email ─────────────────────────────────────────────────────

describe("buildAdminNewLeadEmail", () => {
  it("renders valid HTML", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex@startup.io",
      company: "Startup.io",
      message: "Interested in The Advisory package.",
      source: "Contact Form",
    });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("shows the NEW LEAD CAPTURED label", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Alex",
      email: "alex@startup.io",
      source: "Contact Form",
    });
    expect(html).toContain("🎯 NEW LEAD CAPTURED");
  });

  it("shows the lead source prominently", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Jordan",
      email: "jordan@corp.com",
      source: "Book Download (Free Chapter)",
    });
    expect(html).toContain("Book Download (Free Chapter)");
  });

  it("includes the message when provided", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Taylor",
      email: "taylor@dev.io",
      message: "Looking for DevSecOps consulting.",
      source: "Contact Form",
    });
    expect(html).toContain("Looking for DevSecOps consulting.");
  });

  it("includes a Reply Now mailto CTA", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Sam",
      email: "sam@example.com",
      source: "Contact Form",
    });
    expect(html).toContain("Reply Now");
    expect(html).toContain("mailto:sam@example.com");
  });

  it("includes a View CRM link", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Sam",
      email: "sam@example.com",
      source: "Contact Form",
    });
    expect(html).toContain("View CRM");
    expect(html).toContain("/admin/crm");
  });

  it("works without optional fields (lastName, company, message)", () => {
    const html = buildAdminNewLeadEmail({
      firstName: "Anonymous",
      email: "anon@test.com",
      source: "Book Download (Free Chapter)",
    });
    expect(html).toContain("Anonymous");
    expect(html).toContain("anon@test.com");
  });
});

// ─── Time formatting edge cases ───────────────────────────────────────────────

describe("Time formatting in emails", () => {
  it("formats midnight (00:00) as 12:00 AM", () => {
    const booking: BookingEmailData = { ...freeBooking, scheduledTime: "00:00" };
    const html = buildClientConfirmationEmail(booking);
    expect(html).toContain("12:00 AM PT");
  });

  it("formats noon (12:00) as 12:00 PM", () => {
    const booking: BookingEmailData = { ...freeBooking, scheduledTime: "12:00" };
    const html = buildClientConfirmationEmail(booking);
    expect(html).toContain("12:00 PM PT");
  });

  it("formats 13:30 as 1:30 PM", () => {
    const booking: BookingEmailData = { ...freeBooking, scheduledTime: "13:30" };
    const html = buildClientConfirmationEmail(booking);
    expect(html).toContain("1:30 PM PT");
  });

  it("formats 09:00 as 9:00 AM", () => {
    const booking: BookingEmailData = { ...freeBooking, scheduledTime: "09:00" };
    const html = buildClientConfirmationEmail(booking);
    expect(html).toContain("9:00 AM PT");
  });
});
