import { Resend } from "resend";

// Lazily initialize Resend so the server starts even without the key in dev
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

// ─── Shared brand constants ───────────────────────────────────────────────────
const FROM_ADDRESS = "Christopher Cotton <bookings@castlesoflight.com>";
const ADMIN_EMAIL = "christopher@castlesoflight.com";
const BRAND_AMBER = "#D97706";
const BRAND_CYAN = "#06B6D4";
const BG_DARK = "#050508";
const BG_CARD = "#0A0A12";
const BORDER = "#1A2035";
const TEXT_MUTED = "#6B7280";

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Castles of Light</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_DARK};font-family:'Segoe UI',Arial,sans-serif;color:#E5E7EB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_DARK};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px;letter-spacing:0.15em;color:${BRAND_CYAN};font-weight:600;text-transform:uppercase;">● SYS.ONLINE</span>
                    &nbsp;&nbsp;
                    <span style="font-size:11px;letter-spacing:0.12em;color:${TEXT_MUTED};text-transform:uppercase;">CASTLES OF LIGHT // NERVE CENTER</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${BG_CARD};border:1px solid ${BORDER};border-radius:16px;padding:40px 36px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="font-size:11px;color:${TEXT_MUTED};margin:0;letter-spacing:0.05em;">
                CASTLES OF LIGHT · AI INFRASTRUCTURE ARCHITECT · SAN FRANCISCO, CA<br/>
                <a href="https://castlesoflight.com" style="color:${BRAND_CYAN};text-decoration:none;">castlesoflight.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Divider helper ───────────────────────────────────────────────────────────
const divider = `<tr><td style="padding:20px 0;"><hr style="border:none;border-top:1px solid ${BORDER};margin:0;" /></td></tr>`;

// ─── Detail row helper ────────────────────────────────────────────────────────
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:11px;letter-spacing:0.1em;color:${TEXT_MUTED};text-transform:uppercase;width:140px;vertical-align:top;padding-top:2px;">${label}</td>
            <td style="font-size:14px;color:#E5E7EB;font-weight:500;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BookingEmailData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  message?: string | null;
  callTypeName: string;
  durationMinutes: number;
  scheduledDate: string;
  scheduledTime: string;
  timezone?: string | null;
  priceCents?: number | null;
  paymentStatus?: string | null;
  bookingId?: number;
}

// ─── 1. Client Booking Confirmation ──────────────────────────────────────────
export function buildClientConfirmationEmail(data: BookingEmailData): string {
  const isPaid = (data.priceCents ?? 0) > 0;
  const priceDisplay = isPaid
    ? `$${((data.priceCents ?? 0) / 100).toLocaleString()}`
    : "Complimentary";
  const paymentNote = isPaid
    ? data.paymentStatus === "paid"
      ? `<span style="color:#10B981;font-weight:600;">✓ Payment Confirmed</span>`
      : `<span style="color:${BRAND_AMBER};font-weight:600;">⏳ Awaiting Payment</span>`
    : `<span style="color:#10B981;font-weight:600;">✓ No payment required</span>`;

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:28px;">
          <p style="font-size:11px;letter-spacing:0.15em;color:${BRAND_AMBER};text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">BOOKING CONFIRMED</p>
          <h1 style="font-size:28px;font-weight:700;color:#F9FAFB;margin:0 0 12px 0;line-height:1.2;">
            You're on the calendar, ${data.firstName}.
          </h1>
          <p style="font-size:15px;color:#9CA3AF;margin:0;line-height:1.6;">
            Your <strong style="color:#E5E7EB;">${data.callTypeName}</strong> has been received. 
            I'll send you a calendar invite with the meeting link within a few hours.
          </p>
        </td>
      </tr>

      ${divider}

      <!-- Booking Details -->
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 16px 0;font-weight:600;">BOOKING DETAILS</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Call Type", data.callTypeName)}
            ${detailRow("Duration", `${data.durationMinutes} minutes`)}
            ${detailRow("Date", formatDate(data.scheduledDate))}
            ${detailRow("Time", `${formatTime(data.scheduledTime)} PT`)}
            ${detailRow("Investment", `${priceDisplay} &nbsp; ${paymentNote}`)}
            ${data.company ? detailRow("Company", data.company) : ""}
          </table>
        </td>
      </tr>

      ${divider}

      <!-- What to expect -->
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 16px 0;font-weight:600;">WHAT HAPPENS NEXT</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="color:${BRAND_AMBER};font-weight:700;margin-right:10px;">01</span>
                <span style="font-size:14px;color:#D1D5DB;">You'll receive a calendar invite with a Google Meet or Zoom link.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="color:${BRAND_AMBER};font-weight:700;margin-right:10px;">02</span>
                <span style="font-size:14px;color:#D1D5DB;">I'll review your message and come prepared with specific recommendations.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="color:${BRAND_AMBER};font-weight:700;margin-right:10px;">03</span>
                <span style="font-size:14px;color:#D1D5DB;">If you need to reschedule, reply to this email at least 24 hours in advance.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${divider}

      <!-- CTA -->
      <tr>
        <td style="padding-top:24px;text-align:center;">
          <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 20px 0;">
            Questions before our call? Reply directly to this email.
          </p>
          <a href="https://castlesoflight.com" 
             style="display:inline-block;background-color:${BRAND_AMBER};color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">
            Visit Castles of Light →
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content);
}

// ─── 2. Admin Lead Alert ──────────────────────────────────────────────────────
export function buildAdminLeadAlertEmail(data: BookingEmailData): string {
  const isPaid = (data.priceCents ?? 0) > 0;
  const priceDisplay = isPaid
    ? `$${((data.priceCents ?? 0) / 100).toLocaleString()}`
    : "Free / Exploratory";

  const urgencyColor = isPaid ? BRAND_AMBER : BRAND_CYAN;
  const urgencyLabel = isPaid ? "💰 PAID BOOKING" : "📞 NEW BOOKING";

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <p style="font-size:11px;letter-spacing:0.15em;color:${urgencyColor};text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">${urgencyLabel}</p>
          <h1 style="font-size:26px;font-weight:700;color:#F9FAFB;margin:0 0 8px 0;line-height:1.2;">
            ${data.firstName} ${data.lastName}
          </h1>
          ${data.company ? `<p style="font-size:14px;color:${BRAND_CYAN};margin:0;">${data.company}</p>` : ""}
        </td>
      </tr>

      ${divider}

      <!-- Lead Details -->
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 16px 0;font-weight:600;">LEAD INTEL</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Email", `<a href="mailto:${data.email}" style="color:${BRAND_CYAN};text-decoration:none;">${data.email}</a>`)}
            ${data.phone ? detailRow("Phone", `<a href="tel:${data.phone}" style="color:${BRAND_CYAN};text-decoration:none;">${data.phone}</a>`) : ""}
            ${data.company ? detailRow("Company", data.company) : ""}
          </table>
        </td>
      </tr>

      ${divider}

      <!-- Booking Details -->
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_AMBER};text-transform:uppercase;margin:0 0 16px 0;font-weight:600;">SCHEDULED CALL</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Call Type", data.callTypeName)}
            ${detailRow("Duration", `${data.durationMinutes} minutes`)}
            ${detailRow("Date", formatDate(data.scheduledDate))}
            ${detailRow("Time", `${formatTime(data.scheduledTime)} PT`)}
            ${detailRow("Value", `<strong style="color:${isPaid ? BRAND_AMBER : "#E5E7EB"};">${priceDisplay}</strong>`)}
            ${data.paymentStatus ? detailRow("Payment", data.paymentStatus.toUpperCase()) : ""}
          </table>
        </td>
      </tr>

      ${data.message ? `
      ${divider}
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">THEIR MESSAGE</p>
          <div style="background-color:#0D0D1A;border:1px solid ${BORDER};border-left:3px solid ${BRAND_AMBER};border-radius:8px;padding:16px 20px;">
            <p style="font-size:14px;color:#D1D5DB;margin:0;line-height:1.7;font-style:italic;">"${data.message}"</p>
          </div>
        </td>
      </tr>` : ""}

      ${divider}

      <!-- Quick Actions -->
      <tr>
        <td style="padding-top:24px;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${TEXT_MUTED};text-transform:uppercase;margin:0 0 16px 0;">QUICK ACTIONS</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="mailto:${data.email}?subject=Re: Your ${encodeURIComponent(data.callTypeName)} on ${data.scheduledDate}"
                   style="display:inline-block;background-color:${BRAND_AMBER};color:#050508;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;padding:10px 20px;border-radius:6px;text-decoration:none;">
                  Reply to Lead →
                </a>
              </td>
              <td>
                <a href="https://castlesoflight.com/admin/bookings"
                   style="display:inline-block;background-color:transparent;color:${BRAND_CYAN};font-weight:600;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;padding:10px 20px;border-radius:6px;text-decoration:none;border:1px solid ${BRAND_CYAN};">
                  View in CRM →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content);
}

// ─── 3. New Lead Alert (from contact/download forms) ─────────────────────────
export function buildAdminNewLeadEmail(data: {
  firstName: string;
  lastName?: string;
  email: string;
  company?: string | null;
  message?: string | null;
  source: string;
}): string {
  const content = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <p style="font-size:11px;letter-spacing:0.15em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">🎯 NEW LEAD CAPTURED</p>
          <h1 style="font-size:26px;font-weight:700;color:#F9FAFB;margin:0 0 8px 0;">
            ${data.firstName}${data.lastName ? " " + data.lastName : ""}
          </h1>
          <p style="font-size:13px;color:${TEXT_MUTED};margin:0;">Source: <strong style="color:${BRAND_AMBER};">${data.source}</strong></p>
        </td>
      </tr>

      ${divider}

      <tr>
        <td style="padding:20px 0 8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${detailRow("Email", `<a href="mailto:${data.email}" style="color:${BRAND_CYAN};text-decoration:none;">${data.email}</a>`)}
            ${data.company ? detailRow("Company", data.company) : ""}
            ${detailRow("Source", data.source)}
          </table>
        </td>
      </tr>

      ${data.message ? `
      ${divider}
      <tr>
        <td style="padding:20px 0 8px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;color:${BRAND_CYAN};text-transform:uppercase;margin:0 0 12px 0;font-weight:600;">MESSAGE</p>
          <div style="background-color:#0D0D1A;border:1px solid ${BORDER};border-left:3px solid ${BRAND_CYAN};border-radius:8px;padding:16px 20px;">
            <p style="font-size:14px;color:#D1D5DB;margin:0;line-height:1.7;">${data.message}</p>
          </div>
        </td>
      </tr>` : ""}

      ${divider}

      <tr>
        <td style="padding-top:24px;">
          <a href="mailto:${data.email}"
             style="display:inline-block;background-color:${BRAND_AMBER};color:#050508;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;padding:10px 20px;border-radius:6px;text-decoration:none;">
            Reply Now →
          </a>
          &nbsp;&nbsp;
          <a href="https://castlesoflight.com/admin/crm"
             style="display:inline-block;background-color:transparent;color:${BRAND_CYAN};font-weight:600;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;padding:10px 20px;border-radius:6px;text-decoration:none;border:1px solid ${BRAND_CYAN};">
            View CRM →
          </a>
        </td>
      </tr>
    </table>`;

  return emailWrapper(content);
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendClientConfirmation(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  const html = buildClientConfirmationEmail(data);
  const subject = `Your ${data.callTypeName} is confirmed — ${formatDate(data.scheduledDate)}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.email,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send client confirmation:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
  console.log(`[Email] Client confirmation sent to ${data.email}`);
}

export async function sendAdminLeadAlert(data: BookingEmailData): Promise<void> {
  const resend = getResend();
  const html = buildAdminLeadAlertEmail(data);
  const isPaid = (data.priceCents ?? 0) > 0;
  const subject = isPaid
    ? `💰 Paid Booking: ${data.firstName} ${data.lastName} — ${data.callTypeName} on ${formatDate(data.scheduledDate)}`
    : `📞 New Booking: ${data.firstName} ${data.lastName} — ${data.callTypeName} on ${formatDate(data.scheduledDate)}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send admin lead alert:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
  console.log(`[Email] Admin lead alert sent for booking by ${data.email}`);
}

export async function sendAdminNewLeadAlert(data: {
  firstName: string;
  lastName?: string;
  email: string;
  company?: string | null;
  message?: string | null;
  source: string;
}): Promise<void> {
  const resend = getResend();
  const html = buildAdminNewLeadEmail(data);
  const subject = `🎯 New Lead: ${data.firstName}${data.lastName ? " " + data.lastName : ""} via ${data.source}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_EMAIL,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send new lead alert:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
  console.log(`[Email] New lead alert sent for ${data.email} (source: ${data.source})`);
}
