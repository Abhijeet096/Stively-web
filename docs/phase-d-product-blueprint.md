# Stively — Phase D: Product Architecture & UX Blueprint

**Status:** Product/UX strategy only — no components, no page code.
**Extends:** Phase A (IA, journeys, schema) and Phase C (design system) — this phase resolves the gaps Phase A left open (Mentor, Company/Client) and goes deeper on funnel, SEO, and dashboard structure.

---

## 1. Complete sitemap

```
stively.com
│
├─ /                              Home
├─ /about                         About
├─ /services                      Services
├─ /training                      Training hub (Programs, Pricing, Curriculum, FAQ)
│   └─ /programs/[slug]           Individual program detail
├─ /pricing                       Pricing
├─ /mentors                       Become a Mentor (NEW — see §3.3)
├─ /careers                       Careers (static + register interest)
├─ /contact                       Contact
├─ /faq                           FAQ
├─ /legal/privacy-policy
├─ /legal/terms-of-service
├─ /legal/refund-policy
│
├─ /login                         Auth
├─ /login/verify                  "Check your email" (magic-link sent)
├─ /signup                        Auth (mirrors /login — see §6)
│
├─ /dashboard                     Student home (authenticated)
├─ /dashboard/programs            Enrolled programs
├─ /dashboard/programs/[id]       Program workspace (materials, progress)
├─ /dashboard/settings            Profile/account settings
│
└─ /blog → proxied to stively-blog (per Phase B decision, not built here)
```

**What's deliberately absent:** a public `/companies` or `/hire` page. Per the scope note above, the Company/Client journey gets a capture point, not a page — see §3.4. Building a full page for a funnel with no product behind it yet (no talent pool, no case studies, nothing to show) would either sit empty or overpromise. Add the page when there's something real to put on it.

---

## 2. Navigation structure

**Primary nav (desktop, per Phase C's `Navbar`):** About, Services, Training, Pricing, Careers — unchanged from Phase C. `/mentors` is **not** added to primary nav.

**Why not:** primary nav real estate is the highest-leverage real estate on the site — every item on it dilutes attention from the one thing Phase 1 actually needs, which is students finding and buying training. Mentor recruitment is real but secondary; it belongs somewhere findable, not somewhere competing with "Training" and "Pricing" for a first-time visitor's attention.

**Where it lives instead:** footer link ("Become a Mentor," under a new "Community" or existing "Company" column) plus a contextual mention on `/about` ("Teaching at Stively" callout). Low-friction to find if you're looking for it, invisible if you're not — correct trade-off for a secondary audience.

**Utility nav (not in primary or footer):** Login/Signup (top-right, always visible, per Phase C's `Navbar`), Dashboard (only visible when authenticated, replaces Login/Signup).

---

## 3. User journeys

### 3.1 Student journey (primary — expanded from Phase A)

Phase A mapped three stages (Discovery → Conversion → Activation). Here's the full funnel with the retention/advocacy stages that were previously out of scope for Foundation but matter for IA now:

| Stage | Touchpoint | User goal | Page | Emotional state |
|---|---|---|---|---|
| Awareness | Google/social/referral | Solve an immediate problem or "learn X" | Blog post (external, proxied) | Curious, skeptical |
| Interest | Click through | "Is this a real company?" | `/`, `/about` | Evaluating trust |
| Consideration | Compare options | "Is there a program for me, and is it worth it?" | `/training`, `/programs/[slug]`, `/pricing` | Comparing, price-sensitive |
| Decision | Ready to commit | "Let me make sure before I pay" | Program detail (testimonials, curriculum, FAQ) | Seeking reassurance |
| Conversion | Checkout | Complete enrollment | `/signup` → Razorpay checkout | Committed, slightly anxious (money moment) |
| Activation | First login | "Did I make the right call?" | `/dashboard` | Validation-seeking |
| Retention | Ongoing | Make progress, feel supported | `/dashboard/programs/[id]` | Needs momentum |
| Advocacy | Post-completion | Share the win | Testimonial request (email, not a page) | Proud, willing to help |

The Advocacy stage is new to this phase and matters structurally: it's why `Testimonial.programId` already exists in the Phase A schema — a completed enrollment is the trigger point for a testimonial request email (Resend), which is how the `/programs/[slug]` social proof actually gets refilled over time instead of going stale.

### 3.2 Blog Reader journey — unchanged from Phase A

Still: Blog post → newsletter capture / related program callout → nurture → conversion. No changes needed here.

### 3.3 Mentor journey (new, Phase 1-relevant — see scope note)

| Stage | Touchpoint | Page |
|---|---|---|
| Discovery | Footer link, `/about` callout, direct referral | `/mentors` |
| Interest | Read what mentoring involves, time commitment, compensation model | `/mentors` |
| Application | Submit interest form | `/mentors` (inline form, not a separate route) |
| Review | Manual review (no self-serve approval in Phase 1) | — (internal, off-platform: email/Sheet review of `Lead` rows filtered by source) |

`/mentors` is a single static page (culture/expectations copy) + one form, structurally identical to `/careers` — same pattern, different audience, reusing the same `Lead` model with a new source value. No new architecture required, which is exactly the point of the unified Lead model decision from Phase A.

### 3.4 Company/Client journey (lightweight — see scope note)

No dedicated page in Phase 1. Capture point: a single line in the `/contact` page ("Looking to hire Stively students or work with us on a project? Mention it below") routing into the same `Lead`/`ContactForm` flow with `source: OTHER` (or a new `COMPANY_INQUIRY` value if volume ever justifies distinguishing it — see §10 schema note).

**Why this is the right call and not corner-cutting:** a company evaluating a hiring/dev-partner relationship needs case studies, a talent pool, credibility signals Stively doesn't have yet in Phase 1. A dedicated page would either be embarrassingly thin or overstate what's available today. A single low-friction capture line costs nothing, loses no real leads (anyone motivated enough to want this will find the contact form), and doesn't force building UI for a funnel with no product behind it.

### 3.5 Mentor/Company relationship to the schema

Both journeys reuse the existing `Lead` model (Phase A) rather than new tables. The only schema-adjacent decision this phase surfaces: `LeadSource` should eventually grow a `MENTOR_APPLICATION` value alongside the existing `CONTACT_FORM` / `PROGRAM_INTEREST` / `CAREERS` / `NEWSLETTER_POPUP` / `OTHER`. **Flagging this now, not changing schema now** — per this phase's own "no code yet" instruction, this is a note for whoever next touches `prisma/schema.prisma`, not an implementation.

---

## 4. Homepage wireframe

Text wireframe — layout and intent, not visual design (that's Step 2). Every section maps to a specific funnel stage from §3.1, and per the design system's CTA rule (§Phase C), there is exactly **one** dedicated CTA band on the whole page.

```
┌─────────────────────────────────────────────────────────┐
│ NAVBAR (sticky, transparent → solid on scroll)            │
├─────────────────────────────────────────────────────────┤
│                                                             │
│               HERO                                         │
│   Eyebrow: "For students who want the real thing"          │
│   H1: outcome-focused, not feature-focused                 │
│   Subhead: one sentence, who this is for                   │
│   [Primary CTA: Explore Programs]  [Secondary: How it works]│
│   (no stock photography — a real product/UI glimpse        │
│    or a simple abstract graphic, per Phase C restraint)    │
│                                                             │
├─────────────────────────────────────────────────────────┤
│  TRUST BAND (muted background)                             │
│  "Trusted by students from ..." / stat counters             │
│  (only if real numbers exist — an empty trust band is       │
│   worse than no trust band; cut this section if Phase 1     │
│   launches with zero users)                                │
├─────────────────────────────────────────────────────────┤
│  PROGRAMS OVERVIEW                                          │
│  3-column ProgramCard grid (Phase C `Card variant=interactive`)│
│  Pulls from Program model, published=true, limit 3          │
│  [View all programs →]                                      │
├─────────────────────────────────────────────────────────┤
│  HOW IT WORKS                                                │
│  3-4 step horizontal process: Enroll → Learn → Build → Get hired/certified│
│  Answers "what do I actually get" before price is shown      │
├─────────────────────────────────────────────────────────┤
│  TESTIMONIALS                                                │
│  Carousel or 3-card grid, pulled from Testimonial model      │
├─────────────────────────────────────────────────────────┤
│  CTA BAND (the one dedicated CTA section — inverted bg,      │
│  per Phase C §18/§19)                                        │
│  "Ready to start?" → [Explore Programs]                      │
├─────────────────────────────────────────────────────────┤
│  FOOTER (Phase C `Footer` component)                          │
└─────────────────────────────────────────────────────────┘
```

**Deliberately excluded:** a features grid (generic SaaS pattern that doesn't map to an education product), a pricing table on the homepage itself (pricing belongs on `/pricing` and `/programs/[slug]` where there's context — showing bare numbers on the homepage before establishing value is a conversion mistake, not a shortcut).

---

## 5. Authentication flow

Per Phase B's decision (Google OAuth + Resend magic-link, no passwords):

```
/login
  ├─ [Continue with Google] → Google OAuth consent → callback → session created → redirect
  │
  └─ Email input → [Continue with email]
        → /login/verify ("Check your email — we sent a link to x@y.com")
        → user clicks link in email
        → session created → redirect to callbackUrl (or /dashboard if none)
```

**`/signup` vs `/login`:** same underlying flow, same page component — Auth.js doesn't distinguish "new" vs "returning" for either provider (Google account or email either already exists or gets created transparently via the Prisma adapter). `/signup` exists as a URL for marketing/intent purposes (a "Get Started" button should say and link to `/signup`, not `/login`, even though they render the same UI) — separate route, shared component, no duplicated logic.

**Account-linking edge case, flagged for implementation:** if the same person uses Google first and email-magic-link second (or vice versa) with the same email address, that's two sign-in methods for one real person. Auth.js's default behavior here needs to be explicitly verified against current Auth.js docs at implementation time (this has evolved across versions) rather than assumed — get it wrong and you either silently merge two people's data (security bug) or fragment one person into two accounts (support headache). Noting as a required implementation-time check, not resolving it here since it's a config decision made when the auth pages are actually built.

**Callback URL handling:** already wired at the infrastructure level — Phase B's `proxy.ts` redirects unauthenticated `/dashboard` access to `/login?callbackUrl=...`, so this isn't new work, just confirming the UX path is already supported end-to-end.

---

## 6. Dashboard architecture

**Shell pattern: persistent left sidebar, not top tabs.** This is a deliberate context switch from the marketing site's top nav — when a user enters `/dashboard`, they should feel like they've walked into "the app," matching the pattern every product on the inspiration list uses (Linear, Notion, Vercel all shift from a marketing top-nav to an app sidebar). It also scales better: today it's two items (Overview, Programs), but Settings, Certificates, and Billing are inevitable additions, and a sidebar absorbs new items without a redesign the way a tab bar doesn't.

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar   │  Dashboard Overview                   │
│           │  ┌────────────────────────────────┐   │
│ Stively   │  │ Welcome back, [name]             │   │
│           │  │ Enrolled programs: N              │   │
│ Overview  │  └────────────────────────────────┘   │
│ Programs  │                                        │
│ Settings  │  Enrolled Program cards (or EmptyState  │
│           │  from Phase C if zero enrollments)      │
│ [Logout]  │                                        │
└──────────┴──────────────────────────────────────┘
```

**`/dashboard/programs/[id]`:** the program workspace — materials, progress, certificate (once earned). Intentionally under-specified here since building the actual learning-content model (modules, lessons, completion tracking) is LMS territory the Phase A schema deliberately deferred (`Program.syllabus` is a JSON blob today, not a relational module structure) — right call for Phase 1, becomes a real design decision at Step 6 of the original roadmap ("video lessons, assignments, certificates, progress"), not now.

**Empty states everywhere:** zero enrollments, zero certificates — every one of these uses the `EmptyState` component already built in Phase C. This phase's job was making sure the dashboard's information architecture actually has empty-state moments identified, not just happy-path screens.

---

## 7. Lead generation flow

Every capture point across the whole site funnels into the same place — Phase A's unified `Lead` model — differentiated only by `source`:

| Source | Entry point | Notes |
|---|---|---|
| `CONTACT_FORM` | `/contact` | Includes company/client inquiries (§3.4) until volume justifies a dedicated source |
| `PROGRAM_INTEREST` | Inline on `/programs/[slug]` — "Not ready to enroll? Get program details" | Lower-commitment alternative to full checkout |
| `CAREERS` | `/careers` | |
| `NEWSLETTER_POPUP` | Exit-intent or scroll-triggered, site-wide (implementation detail, not built yet) | Distinct from the footer's always-visible newsletter form, which writes to `NewsletterSubscriber`, not `Lead` |
| `OTHER` | Catch-all | Mentor applications land here until `MENTOR_APPLICATION` is added (§3.5) |

**Nurture strategy (process, not a page):** every new `Lead` triggers a Resend confirmation email ("we got your message"); `PROGRAM_INTEREST` leads specifically enter a short automated sequence (2–3 emails over a week) surfacing testimonials and answering common objections, ending in a direct enrollment CTA. This is a Resend/automation build item for later, documented here so the IA doesn't need to change when it's built.

---

## 8. Conversion funnel

Standard funnel model, mapped to what's measurable with the GA4 setup already in place (Phase B):

```
Awareness       → sessions from organic/social/referral (GA4: acquisition source)
Interest        → /training, /programs/* pageviews
Consideration   → /pricing pageviews, time-on-page on program detail, FAQ expand events
Decision        → "Enroll Now" click (event, not just a pageview)
Conversion      → completed Razorpay payment (Enrollment.status → PAID)
Activation      → first /dashboard login post-purchase
Retention       → dashboard sessions per week (proxy metric until real progress-tracking exists)
Advocacy        → testimonial submitted
```

**Event tracking plan (for whoever wires up GA4 events at build time):** `view_program`, `click_enroll`, `begin_checkout`, `purchase` (with value = `Enrollment.amountPaid`), `submit_lead` (with `source` as a parameter). This list is deliberately short — tracking everything produces noise, not insight; these are the events that answer "where does the funnel leak."

---

## 9. SEO strategy

**Technical foundation:** already built in Phase B (dynamic `sitemap.ts`/`robots.ts`, full metadata/OG/Twitter card setup, self-hosted fonts for performance). This section is the content and structure layer on top of that foundation.

**Content architecture — pillar/cluster model:**
- **Pillar pages:** `/training` (broad, high-volume intent: "coding bootcamp," "industry training for students") and individual `/programs/[slug]` pages (specific intent: "React developer training program").
- **Cluster content:** blog posts (on `stively-blog`, proxied later per Phase B) targeting long-tail, top-of-funnel queries, each internally linking to the relevant pillar program page. This is *why* the Phase B decision to eventually proxy the blog under `stively.com/blog` matters for SEO — cluster content only reinforces pillar authority if it's on the same domain.

**Structured data (JSON-LD), per page type:**
- `Organization` — site-wide, root layout
- `Course` — every `/programs/[slug]` page (price, duration, provider)
- `Article` — blog posts (once proxied)
- `BreadcrumbList` — every page below the top level
- `FAQPage` — `/faq` and any page with an inline FAQ accordion (Phase C's `FAQAccordion` component)

**URL structure:** already governed by Phase A's conventions (lowercase, hyphenated, no trailing slash, human-readable slugs, never changed once live). Reaffirmed here as a strict rule, not a preference — broken/redirected URLs from slug changes are one of the most common self-inflicted SEO injuries.

**Internal linking rule:** every blog post links to exactly one relevant program (per Phase A's blog→lead journey); every program page links back to `/training` and forward to `/pricing` and `/contact`. No orphaned pages — everything in the sitemap should be reachable within 2 clicks from `/`.

---

## 10. Page hierarchy

| Tier | Pages | Characteristic |
|---|---|---|
| **Primary** (top nav) | Home, About, Services, Training, Pricing, Careers | High-intent, high-traffic, drive the core funnel |
| **Secondary** (footer only) | Mentors, FAQ, Contact, Legal pages | Findable, not competing for primary attention |
| **Utility** (neither nav) | Login, Signup, Dashboard and children | Functional, not discovery-oriented |
| **Detail/dynamic** | `/programs/[slug]` | Reached via Primary tier, not directly navigable from nav |

**Depth rule:** public marketing pages never exceed 2 levels (`/training/programs/[slug]` was considered and rejected in favor of the flatter `/programs/[slug]` — shallower URLs both rank better and are easier to reason about). Dashboard is allowed a third level (`/dashboard/programs/[id]`) since it's a functional app surface, not a page a search engine or a first-time visitor needs to parse.

---

## 11. CTA strategy

One primary action per page, stated explicitly so it's never ambiguous during build:

| Page | Primary CTA | Secondary CTA |
|---|---|---|
| Home | Explore Programs | How it works (scroll) |
| Training hub | View Program (per card) | Talk to us |
| Program detail | Enroll Now | Get program details (→ Lead) |
| Pricing | Enroll Now | Contact us |
| About | Explore Programs | Become a Mentor |
| Careers | Register Interest | — |
| Mentors | Apply to Mentor | — |
| Contact | Send Message | — |
| Blog post (external) | View related program | Subscribe |

Rule carried over from Phase C: one *dedicated CTA section* per page maximum; nav/header CTAs and inline contextual buttons don't count against this — the rule is about not stacking multiple competing conversion bands down a single page.

---

## 12. Footer architecture

Extending Phase C's built footer (Product / Company / Legal columns): add **Mentors** to the Company column (`/mentors` alongside `/about`, `/careers`, `/contact`). No new column needed — this is exactly the kind of incremental addition the existing structure was built to absorb without a redesign.

---

## 13. Future scalability

How this architecture holds up against the full roadmap (Students → Training → Projects → Internships → Real Client Projects → Hiring → Enterprise Partnerships) without a rewrite:

- **Lead model** already accepts new `source` values — Company/Client and Mentor both slot in without new tables.
- **Dashboard sidebar** absorbs new modules (Certificates, Projects, Internship applications) as list items, not structural changes.
- **`stively-blog` proxy path** (Phase B) means content SEO investment compounds under one domain even as the blog itself stays a separate, independently-deployed codebase.
- **`/services` and `/mentors` as flat pages today** can graduate into full sections with their own sub-pages later (e.g., `/services/[offering]` for client project types) without breaking the 2-level depth rule established in §10 — it's additive, not a restructure.
- **Admin app** (`admin.stively.com`, deferred in Phase B) becomes necessary once lead volume and content management outgrow direct database access — the two-project split from Phase B already anticipated this by keeping `stively-web` from becoming a monolith that would need to be untangled later.

The common thread: nothing in this phase requires the Phase A/B/C foundation to change shape — it's additive at every layer, which is the actual test of whether an architecture was "built to last 5 years" or just got lucky so far.
