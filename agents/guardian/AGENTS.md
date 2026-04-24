# GUARDIAN — Agent Army Directory

This file describes all agents in the Castles of Light army. GUARDIAN uses this to monitor and report on each agent's health and activity.

## Agent Roster

| Agent | ID | Workspace | Primary Channel | Slash Command | Schedule |
|-------|----|-----------|-----------------|---------------|----------|
| GUARDIAN | guardian | workspace-guardian | #agent-alerts | /agentstatus | Every 6h + daily 07:45 CT |
| SCOUT | scout | workspace-scout | #agent-alerts | /scout | Mon-Fri 07:00 CT |
| HERALD | herald | workspace-herald | #herald-approvals | (auto) | Mon-Fri 09:00 CT |
| CLOSER | closer | workspace-closer | #closer-briefs | /closer [name] | On discovery call trigger |
| KEEPER | keeper | workspace-keeper | #revenue-pulse | /revenue | Daily 08:00 CT |
| TRACKER | tracker | workspace-tracker | #agent-alerts | /leads | Mon 08:00 CT + every 6h |

## Slack Channels

| Channel | Purpose | Primary Agent |
|---------|---------|---------------|
| #agent-alerts | System health, SCOUT results, TRACKER alerts | GUARDIAN, SCOUT, TRACKER |
| #herald-approvals | Email drafts awaiting Christopher's ✅ | HERALD |
| #agent-logs | Audit log of all email sends | HERALD |
| #closer-briefs | Pre-call intelligence briefs | CLOSER |
| #revenue-pulse | Daily revenue and pipeline digest | KEEPER |

## Environment Variables

All agents share these environment variables (set in /root/.openclaw/.env):

- `ANTHROPIC_API_KEY` — Claude API access
- `SLACK_BOT_TOKEN` — Slack bot authentication
- `SLACK_APP_TOKEN` — Slack Socket Mode
- `APOLLO_API_KEY` — Apollo.io prospect search
- `RESEND_API_KEY` — Email sending via Resend
- `OUTREACH_FROM_EMAIL` — chriscotton@castlesoflight.com
- `STRIPE_SECRET_KEY` — Stripe payment data
- `NERVE_CENTER_API_URL` — https://castlesai-uuszelr6.manus.space
- `NERVE_CENTER_API_KEY` — Nerve Center CRM authentication
- `STALE_LEAD_DAYS` — Days before a lead is considered stale (default: 7)

## Business Context

**Operator:** Christopher Cotton
**Company:** Castles of Light (castlesoflight.com)
**Goal:** $50K MRR within 90 days
**Offers:**
- The Sprint: $15,000 one-time, 3-day infrastructure assessment + roadmap
- The Advisory: $10,000/month fractional CTO retainer

**ICP:** Series A-C fintech and healthcare CTOs/VP Engineering with cloud cost, deployment velocity, or compliance pain. US-based, 20-200 employees.

## VPS Details

- Host: srv902802.hstgr.cloud (31.97.99.86)
- OS: Ubuntu 24.04
- OpenClaw service: `systemctl --user status openclaw-gateway`
- Logs: `journalctl --user -u openclaw-gateway -f`
