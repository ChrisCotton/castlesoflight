// ─── Outreach Email Wrapper ───────────────────────────────────────────────────
// Wraps template body HTML in the cinematic HUD brand shell used across all
// Castles of Light transactional emails.

const BG_DARK = "#050508";
const BG_CARD = "#0A0A12";
const BORDER = "#1A2035";
const BRAND_CYAN = "#06B6D4";
const TEXT_MUTED = "#6B7280";

/**
 * Wraps a raw HTML body (from a template) in the full Castles of Light
 * HUD-branded email shell. The body is injected inside the card container.
 */
export function buildOutreachEmail(bodyHtml: string): string {
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
              <span style="font-size:11px;letter-spacing:0.15em;color:${BRAND_CYAN};font-weight:600;text-transform:uppercase;">● SYS.ONLINE</span>
              &nbsp;&nbsp;
              <span style="font-size:11px;letter-spacing:0.12em;color:${TEXT_MUTED};text-transform:uppercase;">CASTLES OF LIGHT // NERVE CENTER</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${BG_CARD};border:1px solid ${BORDER};border-radius:16px;padding:40px 36px;font-size:15px;line-height:1.7;color:#D1D5DB;">
              ${bodyHtml}
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
