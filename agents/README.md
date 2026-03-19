# Castles of Light — Agent Army

This directory contains the system prompt files for all 6 OpenClaw agents that power the Castles of Light business automation.

## Architecture

Each agent has its own workspace directory on the VPS at `/root/.openclaw/workspace-{agent-name}/`. OpenClaw automatically injects the workspace files as "Project Context" into every agent run.

## Agent Roster

| Agent | Role | Primary Channel | Schedule |
|-------|------|-----------------|----------|
| **GUARDIAN** 🛡️ | System health monitor | #agent-alerts | Every 6h + daily 07:45 CT |
| **SCOUT** 🔍 | Prospect intelligence & lead generation | #agent-alerts | Mon-Fri 07:00 CT |
| **HERALD** 📨 | Outreach execution (human-in-the-loop) | #herald-approvals | Mon-Fri 09:00 CT |
| **CLOSER** 🎯 | Pre-call intelligence briefs | #closer-briefs | On discovery call trigger |
| **KEEPER** 💰 | Revenue tracking & pipeline digest | #revenue-pulse | Daily 08:00 CT |
| **TRACKER** 📋 | CRM staleness monitoring | #agent-alerts | Mon 08:00 CT + every 6h |

## File Structure

Each agent directory contains:

- `IDENTITY.md` — Who the agent is, its mission, personality, and business context
- `SOUL.md` — Detailed behavior rules, workflows, output formats, and API usage
- `AGENTS.md` — Agent army context, upstream/downstream relationships, API references
- `TOOLS.md` — (GUARDIAN only) VPS-specific tool reference and environment details

## Deployment

To deploy updated files to the VPS:

```bash
# From repo root
PASS='[VPS_ROOT_PASSWORD]'
VPS='root@31.97.99.86'

for agent in guardian scout herald closer keeper tracker; do
  for file in IDENTITY.md SOUL.md AGENTS.md; do
    sshpass -p "$PASS" scp agents/$agent/$file "$VPS:/root/.openclaw/workspace-$agent/$file"
  done
done
sshpass -p "$PASS" scp agents/guardian/TOOLS.md "$VPS:/root/.openclaw/workspace-guardian/TOOLS.md"

# Restart gateway
sshpass -p "$PASS" ssh "$VPS" 'systemctl --user restart openclaw-gateway'
```

## Slack Commands

| Command | Agent | Action |
|---------|-------|--------|
| `/agentstatus` | GUARDIAN | Full system health report |
| `/scout` | SCOUT | Run prospect search now |
| `/scout [company]` | SCOUT | Research specific company |
| `/closer [name]` | CLOSER | Generate pre-call brief |
| `/revenue` | KEEPER | On-demand revenue digest |
| `/leads` | TRACKER | On-demand pipeline status |

## Business Context

**Operator:** Christopher Cotton  
**Company:** Castles of Light (castlesoflight.com)  
**Goal:** $50K MRR in 90 days  
**Offers:** The Sprint ($15K one-time) · The Advisory ($10K/month)  
**ICP:** Series A-C fintech and healthcare CTOs, 20-200 employees, US-based
