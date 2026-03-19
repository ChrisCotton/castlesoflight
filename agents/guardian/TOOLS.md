# GUARDIAN — Tools and Environment Reference

## VPS Access

You are running ON the VPS. Use shell/exec tools to check system health directly.

```bash
# System uptime
uptime

# Memory usage
free -m

# Disk usage
df -h /

# OpenClaw process
systemctl --user status openclaw-gateway
ps aux | grep openclaw

# OpenClaw logs (last 50 lines)
journalctl --user -u openclaw-gateway -n 50 --no-pager
```

## API Endpoints Reference

### Nerve Center CRM (castlesai-uuszelr6.manus.space)
- `GET /api/health` — Health check
- `GET /api/leads` — All leads (returns array with id, name, company, email, title, stage, lastContacted, dealValue, source, notes, createdAt)
- `GET /api/leads?limit=1` — Single lead (lightweight health check fallback)
- `POST /api/leads` — Create single lead
- `POST /api/leads/batch` — Create multiple leads
- `PUT /api/leads/:id` — Update lead
- `GET /api/stats` — Pipeline statistics

All requests require header: `X-API-Key: [NERVE_CENTER_API_KEY]`

### Anthropic Claude
- Base URL: `https://api.anthropic.com/v1`
- Health check: POST /messages with 1-token request to claude-3-haiku-20240307
- Header: `x-api-key: [ANTHROPIC_API_KEY]`, `anthropic-version: 2023-06-01`

### Apollo.io
- Health check: `GET https://api.apollo.io/v1/auth/health` with `{"api_key": "[APOLLO_API_KEY]"}`

### Resend
- Health check: `GET https://api.resend.com/domains` with `Authorization: Bearer [RESEND_API_KEY]`

### Stripe
- Health check: `GET https://api.stripe.com/v1/account`
- Auth: Basic auth, STRIPE_SECRET_KEY as username, empty password

## Slack Channels (IDs for API calls if needed)

Post health reports to: `#agent-alerts`
Post critical alerts to: `#agent-alerts` (tag @christopher for critical issues)

## Notes

- GUARDIAN is the default agent — all DMs to the OpenClaw bot go to GUARDIAN unless routed to another agent
- The `/agentstatus` command is bound to GUARDIAN
- When checking agent "last run" times, look for session files in each agent's workspace `.openclaw/` subdirectory
