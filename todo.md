# Castles of Light — Nerve Center TODO

## Phase 1: Foundation
- [x] Database schema (leads, bookings, availability, call types, interactions, notes, tags)
- [x] Global design system (dark theme, fonts, CSS variables)
- [x] App routing structure (public + admin)
- [x] Navigation (public top nav + admin sidebar)

## Phase 2: Public Sales Machine
- [x] Hero section ("3-Month Infrastructure in 48 Hours")
- [x] Social proof / logos bar (Spotify, Google, Raytheon, etc.)
- [x] Velocity Case Studies section (LearnLab, Clapself, Raytheon)
- [x] Two-tier offer section (The Sprint $15k, The Advisory $10k/mo)
- [x] Authority section (HARDCORE book + email capture lead magnet)
- [x] Footer with contact info and links
- [x] Contact/inquiry form → feeds CRM

## Phase 3: Booking System (Calendly Clone)
- [x] Public booking page (select call type → pick date/time → fill form → confirm)
- [x] Call type configuration (Exploratory Call free, Paid Consulting $500/hr, Sprint Kickoff)
- [x] Availability management (admin sets weekly schedule + blocked dates)
- [x] Time slot generation based on availability
- [x] Booking confirmation page + email notification to admin
- [x] Admin booking management (view, confirm, cancel bookings)

## Phase 4: Admin CRM Dashboard
- [x] Admin login gate (role-based access)
- [x] CRM pipeline board (Kanban: New Lead → Contacted → Qualified → Proposal → Closed Won/Lost)
- [x] Lead card with name, company, deal value, stage, last contact
- [x] Add/edit lead form
- [x] Contact detail page (full timeline, notes, tags, quick actions)
- [x] Interaction history log (calls, emails, meetings)
- [x] Notes system with timestamps
- [x] Quick actions (email link, schedule call, move stage)

## Phase 5: Analytics & Integration
- [x] Analytics dashboard (conversion funnel, booking rates, pipeline value, lead sources)
- [x] Lead capture forms auto-feed CRM (book download, consultation request, contact form)
- [x] Admin notifications on new lead/booking

## Phase 6: Polish & Tests
- [x] Vitest unit tests for all tRPC procedures (20 tests passing)
- [x] Mobile responsiveness pass
- [x] Final checkpoint and delivery

## Design Overhaul (Reference-Driven)
- [x] Overhaul CSS: deep black, prismatic cyan/teal/amber palette, HUD terminal typography
- [x] Rebuild hero: prismatic light streak SVG/CSS animation, HUD data overlays, cinematic layout
- [x] Add SYS.ONLINE status bar and terminal HUD elements throughout
- [x] Add testimonials/quotes section with cinematic card design
- [x] Polish admin sidebar to match new HUD aesthetic
- [x] Final checkpoint and delivery

## Stripe Payment Integration
- [x] Add Stripe npm package and scaffold
- [x] Extend bookings schema: price_cents, currency, stripe_session_id, payment_status, payment_intent_id
- [x] Extend call_types schema: price_cents, currency, is_paid
- [x] Server: createCheckoutSession tRPC procedure
- [x] Server: Stripe webhook handler (checkout.session.completed, payment_intent.payment_failed)
- [x] Public booking flow: redirect to Stripe Checkout after slot selection
- [x] Public booking flow: /book/success and /book/cancel pages
- [x] Admin bookings: show payment status badge (paid/pending/failed/free)
- [x] Admin availability: set price per call type
- [x] Vitest tests for payment procedures (30 total tests passing)
- [x] Final checkpoint
