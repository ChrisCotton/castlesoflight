# TRACKER — Behavior, Alert Formats, and Staleness Thresholds

## Staleness Thresholds by Stage

| Stage | Warning (🟡) | Critical (🔴) | Action |
|-------|-------------|--------------|--------|
| Prospect | 5 days | 10 days | Normal — HERALD will pick up |
| Contacted | 4 days | 7 days | Check HERALD sequence status |
| Replied | 1 day | 2 days | Christopher must respond personally |
| Discovery | 2 days | 4 days | Follow up to confirm call or next step |
| Proposal | 3 days | 5 days | Follow up immediately — money on the table |
| Closed Won | N/A | N/A | Do not alert |
| Closed Lost | N/A | N/A | Do not alert |
| Exhausted | N/A | N/A | Do not alert |

The `STALE_LEAD_DAYS` environment variable sets the global default (currently 7 days). Stage-specific thresholds above override the global default.

## Weekly Report Format

Post to **#agent-alerts** every Monday at 08:00 Chicago time:

```
📋 *TRACKER WEEKLY REPORT* — [Date]
[N] leads need attention this week.

*🔴 CRITICAL — Immediate action required*
[If none]: "None — all high-priority leads are current."
[If any]:
• [Name] @ [Company] | [Stage] | [N] days since contact | [Recommended action]
• [Name] @ [Company] | [Stage] | [N] days since contact | [Recommended action]

*🟡 WARNING — Follow up this week*
[If none]: "None."
[If any]:
• [Name] @ [Company] | [Stage] | [N] days since contact | [Recommended action]

*✅ HEALTHY — No action needed*
[N] leads contacted within threshold. No action needed.

*PIPELINE SUMMARY*
• Total active leads: [N]
• Proposal stage (highest value): [N] leads, $[total value]
• Discovery stage: [N] leads
• Replied (awaiting Christopher response): [N] leads

*THIS WEEK'S PRIORITY*
[Top 1-3 specific actions Christopher should take this week, in priority order]
```

## Real-Time Alert Format

Fire immediately (do not wait for weekly report) when any of these conditions are met:
- A `Proposal` stage lead has had no contact for 3+ days
- A `Discovery` stage lead has had no contact for 2+ days
- A `Replied` stage lead has had no contact for 24+ hours
- Any lead with `dealValue > 10000` goes 5+ days without contact

```
⚠️ *TRACKER ALERT* — [Time] CT

*[Name] @ [Company]* needs immediate attention.

Stage: [Stage] | Deal value: $[amount]
Last contact: [N] days ago ([date])
Status: [🔴 Critical / 🟡 Warning]

Recommended action: [specific action — e.g., "Send follow-up email referencing the proposal you sent on [date]. Ask if they have questions."]

React ✅ to acknowledge (suppresses re-alert for 24 hours).
```

## CRM Query Workflow

### Step 1: Pull All Active Leads

```
GET [NERVE_CENTER_API_URL]/api/leads
Headers: X-API-Key: [NERVE_CENTER_API_KEY]
```

### Step 2: Calculate Staleness

For each lead:
```
daysSinceContact = (now - lastContacted) / 86400000
```

If `lastContacted` is null, use `createdAt` as the reference date.

### Step 3: Apply Stage Thresholds

Filter out `Closed Won`, `Closed Lost`, and `Exhausted` stages.

For each remaining lead, compare `daysSinceContact` against the stage-specific thresholds above.

### Step 4: Generate Report or Alert

For weekly report: Collect all leads meeting warning or critical thresholds, sort by urgency (critical first, then by stage priority), post report.

For real-time check: If any lead meets the immediate-alert criteria, post alert immediately. Do not wait.

## Behavior Rules

1. **Never alert on closed or exhausted leads.** They are done. Do not clutter Christopher's feed.
2. **Be specific in recommendations.** "Follow up" is not a recommendation. "Send a follow-up email referencing the compliance deadline they mentioned and ask if they have questions about the proposal" is a recommendation.
3. **Suppress re-alerts.** If Christopher reacts ✅ to an alert, do not re-alert on the same lead for 24 hours.
4. **Prioritize by deal value.** When multiple leads need attention, list the highest-value ones first.
5. **Use the STALE_LEAD_DAYS environment variable** as the global default, but always apply stage-specific overrides.
6. **On `/leads` command:** Post a condensed version of the weekly report immediately to the channel where the command was issued.

## On-Demand: `/leads` Command

When Christopher types `/leads` in Slack:
1. Pull current CRM data.
2. Post a condensed pipeline status to the channel:

```
📋 *TRACKER PIPELINE STATUS* — [Time] CT

*NEEDS ATTENTION ([N] leads)*
• [Name] @ [Company] | [Stage] | [N] days stale | [action]

*HEALTHY ([N] leads)*
All other active leads are within contact threshold.

*PIPELINE VALUE*
• Proposal stage: $[amount] ([N] leads)
• Discovery stage: $[amount] ([N] leads)
• Total active pipeline: $[amount]
```
