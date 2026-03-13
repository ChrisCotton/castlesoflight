# Castles of Light — Nerve Center

A full-stack personal brand and client management platform for Christopher Cotton, an AI-augmented infrastructure consultant. The application combines a public-facing marketing site with a private admin Nerve Center that manages the entire client lifecycle — from lead capture through pipeline management, booking, email outreach, and revenue tracking. A separate agent army running on a VPS pushes leads and interactions into the system via an authenticated batch API.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui | Component library via Radix UI primitives |
| **Routing** | Wouter 3 | Lightweight client-side router |
| **Data fetching** | tRPC 11 + TanStack Query 5 | End-to-end type-safe RPC; no REST contracts |
| **Serialization** | SuperJSON | Preserves `Date` objects across the wire |
| **Animation** | Framer Motion, Canvas API | Page transitions + ASCII hero background |
| **Backend** | Node.js + Express 4 | Single server for API and static file serving |
| **API layer** | tRPC 11 | Procedures defined in `server/routers.ts` |
| **ORM** | Drizzle ORM 0.44 | Schema-first, MySQL dialect |
| **Database** | MySQL 8 (TiDB-compatible) | Managed via Manus platform |
| **Auth** | Manus OAuth 2.0 | JWT session cookie; `protectedProcedure` / `adminProcedure` |
| **File storage** | AWS S3 | Via Manus built-in storage helpers |
| **Email** | Resend API | Transactional outreach via `server/email.ts` |
| **Payments** | Stripe | Checkout Sessions + signed webhook at `/api/stripe/webhook` |
| **Build** | Vite 6 + esbuild | Client bundled by Vite; server bundled by esbuild |
| **Package manager** | pnpm | Workspace-aware, lockfile committed |
| **Testing** | Vitest + Supertest | Five test suites, run with `pnpm test` |

---

## Architecture Overview

The application is a monorepo with a single Express server that serves both the tRPC API and the Vite-built React SPA. In development, Vite runs as middleware via `server/_core/vite.ts`; in production, the compiled static assets are served directly from `dist/`. All backend contracts are defined as tRPC procedures in `server/routers.ts` and consumed on the frontend via typed `trpc.*` hooks — no hand-written REST routes or shared contract files are needed.

Authentication flows through Manus OAuth: the `/api/oauth/callback` endpoint exchanges the authorization code, creates or updates the user record, and issues a signed JWT stored in an HTTP-only cookie. Every tRPC request builds a context via `server/_core/context.ts` that exposes `ctx.user` to procedures. Admin-only operations are gated by `adminProcedure`, which checks `ctx.user.role === 'admin'`.

The agent army (running on a separate VPS) communicates with the Nerve Center through a dedicated batch endpoint at `POST /api/leads/batch`, authenticated via an `X-API-Key` header checked against the `CRM_API_KEY` environment variable. This keeps the agent integration decoupled from the OAuth session system.

---

## Architecture Diagram

```mermaid
flowchart LR
    Browser["Browser\n(React SPA)"]
    Admin["Admin Panel\n/admin/*"]
    Agents["Agent Army\n(VPS / OpenClaw)"]

    subgraph Server["Express Server :3000"]
        tRPC["tRPC Router\n/api/trpc"]
        BatchAPI["Batch Leads API\n/api/leads/batch\nX-API-Key auth"]
        StripeWH["Stripe Webhook\n/api/stripe/webhook"]
        OAuthCB["OAuth Callback\n/api/oauth/callback"]
        Static["Vite SPA\n(static in prod)"]
    end

    subgraph External["External Services"]
        DB["MySQL / TiDB\n(Manus managed)"]
        OAuth["Manus OAuth\napi.manus.im"]
        S3["AWS S3\n(Manus storage)"]
        Resend["Resend\n(email)"]
        Stripe["Stripe\n(payments)"]
    end

    Browser -->|"page load"| Static
    Browser -->|"RPC calls"| tRPC
    Admin -->|"protected RPC\nrole=admin"| tRPC
    Agents -->|"POST leads"| BatchAPI

    tRPC --> DB
    BatchAPI --> DB
    OAuthCB --> OAuth
    OAuthCB --> DB
    tRPC --> S3
    tRPC --> Resend
    StripeWH --> Stripe
    StripeWH --> DB
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Authenticated users; `role` enum (`admin` \| `user`) |
| `leads` | CRM pipeline records — contact info, stage, deal value, source, tags |
| `interactions` | Timeline events per lead (email, call, note, meeting) |
| `callTypes` | Configurable service offerings with pricing and duration |
| `availability` | Weekly recurring time slots for booking |
| `blockedDates` | One-off date/time blocks that override availability |
| `bookings` | Client bookings linked to a call type; Stripe payment tracking |
| `emailCaptures` | Lightweight email capture (pre-newsletter, no opt-in required) |
| `newsletterSubscribers` | Full subscriber records with confirmation token and opt-in status |
| `newsletterIssues` | Draft and published newsletter issues with HTML/text content |
| `emailTemplates` | Named outreach templates with subject, body, and variable placeholders |

---

## Admin Nerve Center

All admin routes are protected by `adminProcedure` on the backend and `AdminLayout` on the frontend, which redirects unauthenticated or non-admin users.

| Route | Feature |
|---|---|
| `/admin` | Dashboard — KPI cards (pipeline value, active leads, win rate, won revenue), stage funnel, source breakdown, 30-day velocity chart |
| `/admin/crm` | Kanban pipeline — drag-and-drop lead cards across stages, inline stage dropdown, stale lead indicators |
| `/admin/leads` | Lead Intelligence table — sortable/filterable, days-since-contact column, search, bulk actions |
| `/admin/leads/:id` | Lead detail — full interaction timeline, notes, tags, send-email action |
| `/admin/bookings` | Booking management — list view with payment status, Stripe reference, cancellation |
| `/admin/availability` | Weekly schedule editor — set recurring time slots per day of week |
| `/admin/analytics` | Traffic and engagement charts |
| `/admin/newsletter` | Issue composer — draft, preview, publish; subscriber list management |
| `/admin/email-templates` | Outreach template library — create, edit, preview with variable substitution |

---

## Source Tree

```
castlesoflight/
├── client/
│   ├── index.html                  # Vite entry; Google Fonts CDN links here
│   └── src/
│       ├── App.tsx                 # Route definitions (Wouter) + layout shells
│       ├── main.tsx                # React root; ThemeProvider, tRPC provider
│       ├── index.css               # Global Tailwind theme + CSS variables
│       ├── const.ts                # getLoginUrl(), app constants
│       ├── contexts/               # AuthContext (useAuth hook)
│       ├── hooks/                  # Custom hooks
│       ├── lib/
│       │   ├── trpc.ts             # tRPC client binding (SuperJSON transformer)
│       │   └── utils.ts            # cn() class merger
│       ├── components/
│       │   ├── ui/                 # shadcn/ui primitives (button, card, dialog…)
│       │   ├── AdminLayout.tsx     # Sidebar layout for all /admin/* routes
│       │   ├── AsciiBackground.tsx # Canvas-based Ghostty-style ASCII animation
│       │   ├── NewsletterSignup.tsx # Hero + inline newsletter CTA variants
│       │   └── DashboardLayout.tsx # Generic dashboard shell
│       └── pages/
│           ├── Home.tsx            # Public marketing site (single-page scroll)
│           ├── Book.tsx            # Public booking flow
│           ├── Unsubscribe.tsx     # Newsletter unsubscribe confirmation
│           └── admin/              # All admin panel pages (see table above)
│
├── server/
│   ├── _core/                      # Framework plumbing — do not edit
│   │   ├── index.ts                # Express app entry; mounts all routes
│   │   ├── context.ts              # tRPC context builder (injects ctx.user)
│   │   ├── oauth.ts                # Manus OAuth callback handler
│   │   ├── trpc.ts                 # publicProcedure / protectedProcedure / adminProcedure
│   │   ├── env.ts                  # Typed env var access
│   │   ├── llm.ts                  # invokeLLM() helper
│   │   ├── imageGeneration.ts      # generateImage() helper
│   │   └── notification.ts         # notifyOwner() helper
│   ├── routers.ts                  # All tRPC procedures (lead, booking, capture, newsletter, analytics, auth)
│   ├── db.ts                       # Drizzle query helpers
│   ├── email.ts                    # Resend send helpers
│   ├── emailOutreach.ts            # Outreach sequence logic
│   ├── emailTemplateRouter.ts      # Email template CRUD procedures
│   ├── batchLeadsRouter.ts         # POST /api/leads/batch (agent army endpoint)
│   ├── storage.ts                  # S3 storagePut / storageGet wrappers
│   ├── stripe.ts                   # Stripe checkout session creation
│   ├── stripeWebhook.ts            # Stripe webhook handler
│   └── *.test.ts                   # Vitest test suites (auth, batchLeads, email, emailTemplate, stripe)
│
├── drizzle/
│   ├── schema.ts                   # Source of truth for all table definitions
│   ├── relations.ts                # Drizzle relation declarations
│   └── *.sql                       # Generated migration files
│
├── shared/
│   ├── const.ts                    # Constants shared between client and server
│   └── types.ts                    # Shared TypeScript types
│
├── package.json                    # pnpm scripts: dev, build, start, test, db:push
├── vite.config.ts                  # Vite config (React plugin, Tailwind, path aliases)
├── drizzle.config.ts               # Drizzle Kit config
├── tsconfig.json                   # TypeScript project config
└── vitest.config.ts                # Vitest config
```

---

## Getting Started

**Prerequisites:** Node.js 22+, pnpm 9+, a MySQL 8 database, and a Manus platform account (for OAuth and secrets injection).

```bash
# 1. Clone
git clone https://github.com/ChrisCotton/castlesoflight.git
cd castlesoflight

# 2. Install dependencies
pnpm install

# 3. Configure environment
# Copy the variables listed below into a .env file (or inject via your platform)

# 4. Apply database migrations
pnpm db:push

# 5. Start development server
pnpm dev
# → http://localhost:3000
```

For production:

```bash
pnpm build
pnpm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string (`mysql://user:pass@host:port/db`) |
| `JWT_SECRET` | Yes | Secret used to sign session cookies |
| `VITE_APP_ID` | Yes | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Yes | Manus login portal URL (frontend redirect) |
| `OWNER_OPEN_ID` | Yes | Owner's Manus Open ID (used to seed admin role) |
| `OWNER_NAME` | Yes | Owner's display name |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (frontend) |
| `CRM_API_KEY` | Yes | API key for the agent army batch endpoint (`X-API-Key` header) |
| `BUILT_IN_FORGE_API_KEY` | Yes | Manus built-in API bearer token (server-side LLM, storage, notifications) |
| `BUILT_IN_FORGE_API_URL` | Yes | Manus built-in API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Yes | Manus built-in API bearer token (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | Yes | Manus built-in API URL (frontend) |

When deploying on the Manus platform, all variables above are injected automatically. For self-hosted deployments, create a `.env` file at the project root.

---

## Testing

```bash
pnpm test
```

Vitest runs all `*.test.ts` files in the `server/` directory:

| Suite | File | Coverage |
|---|---|---|
| Auth | `server/auth.logout.test.ts` | Session cookie creation, logout, JWT validation |
| Batch Leads | `server/batchLeads.test.ts` | Agent API key auth, lead upsert, validation |
| Email | `server/email.test.ts` | Resend send helper, error handling |
| Email Templates | `server/emailTemplate.test.ts` | Template CRUD, variable substitution |
| Stripe | `server/stripe.test.ts` | Checkout session creation, webhook signature verification |

---

## Agent Army Integration

The Nerve Center exposes a dedicated endpoint for the OpenClaw agent army running on a separate VPS:

```
POST /api/leads/batch
X-API-Key: <CRM_API_KEY>
Content-Type: application/json

[
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "company": "Acme Corp",
    "title": "CTO",
    "source": "linkedin",
    "offerInterest": "sprint",
    "estimatedDealValue": 15000
  }
]
```

Returns `{ "results": [{ "success": true, "leadId": 42 }] }` per record. Duplicate emails are upserted rather than rejected.
