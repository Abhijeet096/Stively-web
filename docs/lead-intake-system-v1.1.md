# Stively Core — Lead Intake System Architecture

**Version:** Lead Intake System Architecture v1.1
**Status:** Architecture Review Complete
**Implementation:** Pending
**Scope:** First module of Stively Core (per `docs/core/stively-core-blueprint-v1.md` §4, Module 2 — CRM). Covers lead capture through conversion handoff only. Everything after conversion (Learning, Project Delivery) belongs to other modules.
**Supported lead types (current business reality):** Student, Business. Mentor, Trainer, Partner, and Investor are explicitly not in scope — see §9 for how the design accommodates them later without a redesign.

This revision incorporates finalized business decisions on lead lifecycle, ownership, reassignment, deduplication, source tracking, and priority. It updates v1.0 rather than replacing it — see the **Version History** at the end of this document for exactly what changed and why. Sections not listed there are unchanged from v1.0.

**Sections revised in v1.1:** §2 (Lead Lifecycle — replaced with finalized pipelines), §3 (Database Design — Lead, LeadHistory, LeadAssignment revised; TeamMember added), §4 (Form Design — company name promoted out of metadata), §6 (Automation — ownership steps added), §7 (API Design — light cross-reference only), §8 (Permissions — simplified per instruction), §9 (Future Expansion — updated cost accounting), §10 (Risks — several added/updated).
**Sections unchanged from v1.0:** §1 (Goals), §5 (CRM Integration, light cross-references only), the `LeadNote` model in §3, and the core mechanism in §9.

---

## 1. Goals

**The problem this solves:** the current `Lead` model is a single flat table with no concept of lead *type*, no history, no ownership, and no way to attach type-specific information. It works for what it was built for — routing every form on the site into one place instead of four near-duplicate tables — but it stops there. It cannot answer "how many business leads did we get this month," cannot show who's working a lead, cannot show what happened to it over time, and cannot hold the different information a business inquiry needs (company, budget, timeline) versus a student inquiry (program interest, education background) without abusing the free-text `message` field.

**Why it exists now:** per the blueprint's Rule #1 ("every feature must increase revenue, reduce cost, save time, improve student outcomes, improve client outcomes, or improve decision making"), this module directly serves the Business Lifecycle and Student Lifecycle (§6/§7 of the blueprint) at their very first step — without a real Lead Intake System, every later module (CRM UI, Sales assignment, Evaluation Engine) has nothing reliable to build on. This is foundational, not incremental.

**What this is explicitly not:** not a CRM UI, not an admin dashboard, not authentication, not mentor/trainer recruitment. Those are named as out of scope in the brief and are treated that way throughout this document — every section below stops at "what data model and contract would let those modules exist later without a rebuild," not "how those modules work."

---

## 2. Lead Lifecycle

**Revised in v1.1.** v1.0 proposed one shared `LeadStatus` enum on the assumption that the Student and Business pipelines had the same shape (new → engaged → validated → outcome) and only differed in what each stage *meant*. The finalized pipelines below show that assumption was wrong: the Student pipeline branches (four possible outcomes after First Call, only one of which continues the pipeline), and the Business pipeline is a long, linear, discovery-and-proposal-specific sequence with no equivalent in the Student flow. These are genuinely different structures now, not just different labels on the same shape — so this revision keeps them as explicitly distinct sequences (still represented as one Prisma enum for database-level reasons — see §3 — but conceptually and operationally distinct pipelines).

**Important clarification carried over directly from the business decision:** "Interested" is an intermediate outcome, not a conversion. A lead only counts as `CONVERTED` at Payment completion (Student) or when the business officially becomes a client (Business) — nowhere earlier in either pipeline.

### Student Lead pipeline

```
Lead Created → Assigned → First Call →
    ├─ Interested ──────────→ Counselling → Enrollment → Payment → Converted
    ├─ Call Back Requested ──→ (loops back to another First Call attempt)
    ├─ Not Responded ────────→ (loops back to another First Call attempt, or eventually Not Interested)
    └─ Not Interested ───────→ (terminal - lead does not proceed)
```

| Status | Meaning |
|---|---|
| `NEW` | Lead created, not yet touched. |
| `ASSIGNED` | Has an active owner (see §3 Ownership) but hasn't been called yet. |
| `FIRST_CALL` | A call attempt has been made; outcome recorded as one of the four below. |
| `INTERESTED` | Confirmed genuine interest — the only outcome that continues the pipeline. |
| `CALLBACK_REQUESTED` | Asked to be called again — not a dead end, expected to loop back to another call attempt. |
| `NOT_RESPONDED` | No answer on this attempt — see the open question below on whether/how this loops. |
| `NOT_INTERESTED` | Explicitly declined — terminal. |
| `COUNSELLING` | Post-interest guidance conversation, prior to enrollment. |
| `ENROLLMENT` | Enrollment process started. |
| `PAYMENT` | Payment in progress/pending. |
| `CONVERTED` | Payment completed — the student is officially a customer. |

**Open question, flagged rather than assumed:** the given pipeline doesn't specify whether `NOT_RESPONDED` allows unlimited retry attempts, a capped number, or a time-based escalation (e.g., three unanswered attempts → treated as `NOT_INTERESTED` automatically). Recommending this be answered before implementation, since it affects whether retry logic is manual (a salesperson just calls again) or needs its own automation rule.

### Business Lead pipeline

```
Lead Created → Assigned → Initial Contact → WhatsApp Discussion → Discovery Call →
    Requirements Gathering → Proposal Sent → Negotiation → Project Approved →
    Development Started → Converted
```

| Status | Meaning |
|---|---|
| `NEW` | Lead created, not yet touched. |
| `ASSIGNED` | Has an active owner but hasn't been contacted yet. |
| `INITIAL_CONTACT` | First outreach made. |
| `WHATSAPP_DISCUSSION` | Ongoing conversation via WhatsApp (ties directly to the WhatsApp integration covered in §5). |
| `DISCOVERY_CALL` | A scheduled discovery conversation happened. |
| `REQUIREMENTS_GATHERING` | Actively documenting what the business actually needs. |
| `PROPOSAL_SENT` | A formal proposal has gone out. |
| `NEGOTIATION` | Scope, price, or terms being discussed. |
| `PROJECT_APPROVED` | Business has said yes. |
| `DEVELOPMENT_STARTED` | Work has begun — notably, this is *before* `CONVERTED` in the given pipeline, meaning "converted" is confirmed slightly after work is already underway, not before. |
| `CONVERTED` | Business is officially a client. |

**Gap, flagged rather than silently patched:** the given Business pipeline has no explicit "did not proceed" terminal status, unlike Student's `NOT_INTERESTED`. Recommending a `LOST` status be added for operational completeness (a real project can fall through at any stage — Proposal, Negotiation, or earlier) and for symmetry with the Student pipeline, but this is a *recommended addition*, not something stated in the finalized business decision — flagging it as a decision still needed from you, not assuming it.

This module's ownership still ends exactly at `CONVERTED` in both pipelines. From there, the Student Lifecycle (blueprint §6: `Registered → Paid → Learning → Evaluation → ...`) and the Project Delivery Engine (blueprint §4, Module 6) take over — unchanged from v1.0.

---

## 3. Database Design

Recommending an **extension** of the existing `Lead` model plus four new models (one more than v1.0 — see `TeamMember` below), not a parallel system. Every new model relates back to the same `Lead` row that already exists today.

### `Lead` (extend existing model)

**Revised in v1.1** to add ownership, priority, acquisition tracking, and deduplication support — each explained below the block.

```
model Lead {
  id              String      @id @default(cuid())
  name            String
  email           String
  phone           String?
  message         String?     @db.Text
  source          LeadSource
  status          LeadStatus  @default(NEW)

  leadType        LeadType
  metadata        Json?

  companyName     String?               // NEW - promoted out of metadata, see below

  priority        LeadPriority @default(MEDIUM)   // NEW

  acquisitionChannel AcquisitionChannel?           // NEW
  utmSource       String?                          // NEW
  utmMedium       String?                          // NEW
  utmCampaign     String?                           // NEW

  currentOwnerId  String?                           // NEW - denormalized pointer, see below
  currentOwner    TeamMember? @relation("CurrentOwner", fields: [currentOwnerId], references: [id])

  programId       String?
  program         Program?    @relation(fields: [programId], references: [id], onDelete: SetNull)

  history         LeadHistory[]
  assignments     LeadAssignment[]
  notes           LeadNote[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  lastEnquiryAt   DateTime    @default(now())       // NEW - see Deduplication below

  @@index([email])
  @@index([phone])
  @@unique([email, leadType])   // see Deduplication - open question on scope
}

enum LeadType {
  STUDENT
  BUSINESS
}

enum LeadPriority {
  LOW
  MEDIUM
  HIGH
}

enum AcquisitionChannel {
  WEBSITE
  GOOGLE_SEARCH
  GOOGLE_ADS
  INSTAGRAM
  FACEBOOK
  LINKEDIN
  REFERRAL
  DIRECT
  INTERNSHALA
  NAUKRI
  INDEED
  MANUAL_ENTRY
  OTHER
}
```

**`leadType`, not a second table per type — unchanged from v1.0.** A `StudentLead`/`BusinessLead` split was considered and rejected: the two types share every operationally important field (status, assignment, history, notes) and differ only in a handful of type-specific attributes. Splitting the table would mean duplicating the entire pipeline/assignment/history machinery twice — exactly the duplication the blueprint's Rule #3 warns against.

**`companyName` promoted to a real column — new in v1.1, answering the explicit request to review whether any `metadata` field is better as a dedicated column.** v1.0 put this in `metadata` alongside industry, budget, and project type. On reflection, `companyName` is different from the others: it's always present for a Business lead (not optional context), and "show me every lead from Company X" is an obviously common, high-value filter/search operation from day one — not a hypothetical future need. Industry, budget range, and project type stay in `metadata` for now, since none of them have the same "always present, obviously searched" characteristics yet — they follow the same graduation path described in v1.0 (move to a real column once actual usage demonstrates the need).

**`currentOwnerId` is a deliberate denormalization, not a design shortcut.** The full, authoritative ownership history still lives in `LeadAssignment` (below) as an append-only log — nothing here replaces that. `currentOwnerId` is a pointer to whichever `TeamMember` is the *currently* active owner, kept in sync every time a new `LeadAssignment` row is marked active. The trade-off: a write now has to update two things instead of one, in exchange for every list/filter/report view ("show me all leads owned by X") not needing a join against `LeadAssignment` filtered to `isActive: true` on every single request. At the blueprint's stated 100,000+ user scale, and given "every lead always has exactly one active owner" is now a hard business rule (not an occasional lookup), this is worth the small write-side cost.

**`@@unique([email, leadType])` — flagged as an assumption, not a certainty.** The business decision says a duplicate email/phone should update the existing lead rather than create a new one, but doesn't say whether that check should be scoped per lead type or globally. This constraint assumes a person can legitimately have one active Student lead *and* one active Business lead at the same time (e.g., exploring training for themselves while also inquiring about a business project) — scoping the uniqueness to `[email, leadType]` rather than `[email]` alone. This is a real decision this document is making on your behalf by default; flagging it clearly rather than burying the assumption in schema syntax. See §10 for the risk if this assumption is wrong.

**`lastEnquiryAt`** is distinct from `createdAt` — `createdAt` marks when the `Lead` row was first created and never changes; `lastEnquiryAt` updates every time the same person submits again, which is exactly the signal the deduplication requirement needs (see the dedicated subsection below).

**What's deliberately unchanged from v1.0:** `programId` stays exactly as it is — a real, queryable foreign key, not folded into `metadata`, for the same reasoning as before (genuinely relational, genuinely high-value to query directly). The `metadata Json?` approach itself is unchanged in principle — still validated at read time via Zod, still following the `Program.syllabus` precedent, still with the same explicit graduation path for individual fields.

### `TeamMember` (new in v1.1 — not authentication)

```
model TeamMember {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      TeamMemberRole

  createdAt DateTime @default(now())
}

enum TeamMemberRole {
  FOUNDER
  SALESPERSON
  ADMIN
}
```

**Why this exists, and why it is explicitly not the authentication system the brief says not to build:** "every lead always has exactly one active owner, defaulting to CEO/Founder" presupposes some way to represent *who* the CEO/Founder and salespeople are. This table holds no credentials, no sessions, no login capability — it's a plain internal roster, structurally closer to `Testimonial.studentName` (a simple named reference) than to a real user account system. It exists purely so `currentOwnerId` and `LeadAssignment` can be real foreign keys instead of free-text name strings — which matters directly for the brief's explicit "think about future searching, filtering, reporting" requirement (a typo-prone text field can't be reliably filtered or joined; a foreign key can). When real authentication is eventually built, this table is the natural thing to merge into or link from a `User` model — a small, planned migration, not a surprise. This is flagged again in §10 as accepted technical debt, not an oversight.

### `LeadStatus` (revised in v1.1 — now a single wide enum covering both pipelines)

```
enum LeadStatus {
  // Shared early stages
  NEW
  ASSIGNED

  // Student pipeline
  FIRST_CALL
  INTERESTED
  CALLBACK_REQUESTED
  NOT_RESPONDED
  NOT_INTERESTED
  COUNSELLING
  ENROLLMENT
  PAYMENT

  // Business pipeline
  INITIAL_CONTACT
  WHATSAPP_DISCUSSION
  DISCOVERY_CALL
  REQUIREMENTS_GATHERING
  PROPOSAL_SENT
  NEGOTIATION
  PROJECT_APPROVED
  DEVELOPMENT_STARTED

  // Shared terminal
  CONVERTED
  LOST   // recommended addition - see §2
}
```

**One enum with type-specific groups, not two separate enums — a reversal of the reasoning direction from v1.0, worth explaining plainly.** Prisma/Postgres can't cleanly express "this column's valid enum depends on another column's value" — the real options were one wide enum (used here) or two nullable status columns (`studentStatus`/`businessStatus`), one of which is always null depending on `leadType`. Two nullable columns is a well-known anti-pattern (every query and every piece of application code has to know which column to look at), so this document recommends the wide enum instead, accepting the trade-off that nothing at the database level stops a `STUDENT` lead from being set to `PROPOSAL_SENT`. That guarantee has to live in the application layer (Zod validation checking `leadType` + `status` combinations are valid before writing), the same boundary-validation pattern already used for `metadata`. This is flagged again in §10 as a real, accepted risk of this trade-off, not a solved problem.

### `LeadHistory` (revised in v1.1 — now a general event timeline, not just status changes)

v1.0 scoped this narrowly to status transitions. The business decision explicitly expands it into a full chronological timeline — "Lead Created → Assigned → Called → WhatsApp Sent → Follow-up Scheduled → Counselling → Payment → Converted" — where every one of those is its own event, not just the status-bearing ones.

```
model LeadHistory {
  id          String        @id @default(cuid())
  leadId      String
  lead        Lead          @relation(fields: [leadId], references: [id], onDelete: Cascade)

  eventType   LeadEventType
  fromStatus  LeadStatus?             // only set when eventType relates to a status change
  toStatus    LeadStatus?             // only set when eventType relates to a status change
  description String?       @db.Text // human-readable detail, e.g. "WhatsApp message sent re: proposal"
  performedBy String?                // TeamMember.id - nullable for system-generated events

  createdAt   DateTime      @default(now())
}

enum LeadEventType {
  LEAD_CREATED
  RE_ENQUIRY          // duplicate submission - see Deduplication below
  ASSIGNED
  REASSIGNED
  CALL_ATTEMPTED
  WHATSAPP_SENT
  FOLLOW_UP_SCHEDULED
  STATUS_CHANGED
  NOTE_ADDED
  CONVERTED
}
```

**Purpose, expanded from v1.0:** still the append-only audit trail v1.0 described, but now the *complete* activity timeline for a lead, not only its status changes. `eventType` is itself a bounded enum (adding a new event type is a small migration, same trade-off already accepted for `AcquisitionChannel`) rather than a free-text field, so that timelines stay filterable and reportable ("how many WhatsApp messages did we send before this lead converted") — directly serving the brief's "future reporting" requirement, not just a readable log for a human to scroll through.

### `LeadAssignment` (revised in v1.1 — ownership is now mandatory, with a reason)

```
model LeadAssignment {
  id           String              @id @default(cuid())
  leadId       String
  lead         Lead                @relation(fields: [leadId], references: [id], onDelete: Cascade)

  ownerId      String                        // TeamMember.id - NOT nullable, see below
  owner        TeamMember          @relation(fields: [ownerId], references: [id])
  assignedById String?                       // TeamMember.id - nullable only for the automatic first assignment
  reason       ReassignmentReason  @default(INITIAL)
  isActive     Boolean             @default(true)

  createdAt    DateTime            @default(now())
}

enum ReassignmentReason {
  INITIAL           // the automatic CEO/Founder default assignment at lead creation
  SLA_BREACH
  UNAVAILABLE
  MANUAL_OVERRIDE
}
```

**`ownerId` is required, not nullable — the one structural change from v1.0's `assignedToId String?`.** v1.0 made this nullable because no auth existed yet; the finalized business decision overrides that with a hard rule ("every lead must ALWAYS have exactly one active owner"), resolved here by the `TeamMember` table above rather than a real user account — the very first `LeadAssignment` row for every lead is created automatically at lead creation, owned by the CEO/Founder's `TeamMember` row, with `reason: INITIAL`. This satisfies the mandatory-ownership rule without needing authentication to exist first.

**Everything else about this model is unchanged from v1.0's reasoning:** still an append-only log (a new row per reassignment, not an overwritten column) specifically because "history of ownership changes must always be preserved" and "future reassignments should never overwrite history" were already the design's premise before this revision — v1.0 already satisfied this requirement structurally; this revision just makes ownership mandatory and adds `reason` to record *why* a reassignment happened, per the finalized reassignment rules (SLA breach, unavailability, manual override).

### `LeadNote` (unchanged from v1.0)

```
model LeadNote {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  authorId  String?            // future TeamMember.id - nullable
  content   String   @db.Text

  createdAt DateTime @default(now())
}
```

**Purpose, unchanged:** freeform internal notes — the manual, human side of working a lead. The business decision to "keep Lead Notes separate from Lead History" confirms this was already the right structural call in v1.0; the only change is `authorId` now conceptually references `TeamMember` instead of a future `User`, consistent with the ownership model above.

### Deduplication (new in v1.1)

The finalized rule: the same email or phone submitting again must not create a second `Lead` row. Instead: update `lastEnquiryAt`, insert a `LeadHistory` row with `eventType: RE_ENQUIRY`, and preserve the existing assignment and notes untouched.

This is implemented as **application logic in `submitLead`** (check for an existing `Lead` matching on email or phone before creating a new one), backed by the `@@index([email])` and `@@index([phone])` additions on `Lead` above so that lookup stays fast as the table grows — a sequential scan for a dedup check would be a real performance problem at the blueprint's stated 100,000+ user scale, an indexed lookup is not.

**Future auth behavior, documented but explicitly not designed further, per the instruction:** once authentication exists, a returning user recognized by login (not just by email/phone match) may be redirected to a login flow instead of re-submitting a duplicate enquiry. This is a UX decision that depends on the authentication system's shape, which doesn't exist yet — noted here as a known future direction, not designed now.

### Lead Priority (new in v1.1)

`LeadPriority` (`LOW` / `MEDIUM` / `HIGH`, defined above) exists purely to help sales prioritize follow-ups — deliberately not a computed/weighted score. A scoring algorithm (weighting recency, source quality, engagement) is a legitimate future idea but is explicitly out of scope here, per the instruction not to overcomplicate this: a three-value manual field a salesperson or the CEO can set is enough to answer "which leads do I call first" today, and a real scoring model can replace it later without a structural change — swapping what sets the value doesn't require changing the field itself.

### Lead Source & Acquisition Tracking (new in v1.1)

**An important distinction this revision surfaces:** the existing `LeadSource` enum (`CONTACT_FORM`, `PROGRAM_INTEREST`, `CAREERS`, `NEWSLETTER_POPUP`, `OTHER`) answers *which form or page on the site* a lead came from — an intake-channel concept. The new requirement asks for *what marketing channel brought them to the site in the first place* (Google Ads, Instagram, Referral, etc.) — an acquisition-attribution concept. These are two different questions and this revision keeps them as two different fields rather than overloading the existing enum: `source` (unchanged) stays the intake-channel field; the new `acquisitionChannel` enum, plus `utmSource`/`utmMedium`/`utmCampaign` as free-text strings (not enums — campaign values are created ad hoc by marketers and shouldn't require a schema migration every time), capture attribution.

**Why this matters for analytics and marketing ROI, as asked:** without this, there's no way to answer the blueprint's own CEO Dashboard question (§11: "Which ad generates highest ROI?") — knowing a lead came from `PROGRAM_INTEREST` (which page) says nothing about whether it came from an organic search, a paid Instagram ad, or a referral link, and those have completely different costs behind them. UTM parameters are the industry-standard mechanism for this because they're set by the marketer at campaign-creation time (in the ad platform or the link itself) and require no extra work from the visitor — the data arrives with the very first page load, before the lead even fills out a form. Without capturing it, cost-per-lead and cost-per-conversion can never be broken down by channel or campaign, which is the specific number that justifies (or kills) a given marketing spend.

### What's intentionally not proposed

No new model for lead *type-specific* data (no `StudentLeadDetails`/`BusinessLeadDetails` tables) — that's what `metadata` is for, per the reasoning above. No `LeadTag` model, no computed `LeadScore`. Nothing in the current business reality calls for either yet, and adding them now would be exactly the "unnecessary features" the brief says to avoid.

---

## 4. Form Design

**Lightly revised in v1.1** — only the Company Name row changed (now a dedicated column, see §3), everything else is unchanged from v1.0.

Both forms share the same core fields (matching `leadSchema` in `src/lib/validations/lead.ts` today) plus a type-specific block that maps to `metadata`.

### Student form

| Field | Required | Validation |
|---|---|---|
| Name | Required | Min 2 characters (existing rule) |
| Email | Required | Valid email format (existing rule) |
| Phone | Optional | — |
| Program of interest | Optional | Must match a real `Program.id` if present — reuses the existing `programId` relation, not `metadata` |
| Current education level / status | Optional | Free text or small enum (e.g., "In college", "Graduated", "Working professional") — `metadata` |
| Preferred start timing | Optional | e.g., "Immediately", "Within 3 months", "Just exploring" — `metadata` |
| Message | Optional | Free text (existing field) |

### Business form

| Field | Required | Validation |
|---|---|---|
| Name | Required | Min 2 characters (existing rule) |
| Email | Required | Valid email format, and ideally a company-domain nudge (not a hard block — free email addresses are common for small businesses too) |
| Phone | Optional | — |
| Company name | Required for this type | **Revised in v1.1** — now `Lead.companyName`, a dedicated column, not `metadata` (see §3) |
| Industry | Optional | `metadata` — could reuse the same category list as the Services page's "Industries we build for" section for consistency |
| Project type | Optional | e.g., "New build", "Existing product", "Consulting" — `metadata` |
| Budget range | Optional | A bracketed range, not an exact figure — lower friction, and matches how the Services page already avoids publishing a fixed rate card |
| Message / project description | Required for this type | Free text (existing field) — this is the one field where Business leads need more than Student leads, since there's no `Program` equivalent to point at |

**Validation approach:** extend the existing `leadSchema` pattern (`src/lib/validations/lead.ts`) with a discriminated union on `leadType` — Zod supports this natively (`z.discriminatedUnion`), so `metadata` gets real validation despite being stored as `Json`, without needing database-level enforcement. This is the same “validate untyped JSON at the boundary” approach already used for `Program.syllabus`.

**Required vs optional, as a principle:** every field genuinely required to *route and follow up* on a lead is required (name, email, and for Business leads, some description of what they need); everything that helps qualify faster but isn't essential to first contact stays optional. This mirrors the existing `leadSchema`'s already-light-touch requirements — the brief for this whole project has consistently favored low-friction capture over long forms, and there's no reason to reverse that here.

---

## 5. CRM Integration

**Unchanged from v1.0 in substance — terminology updated to match §3's revised ownership model.**

**Admin Dashboard (future) consumption:** reads `Lead` (including the new `currentOwnerId`, `priority`, `acquisitionChannel` fields) joined with recent `LeadHistory`/`LeadNote` entries — a lead list view, a lead detail view, and a pipeline/kanban view grouped by `status` are the three views this data model directly supports without further design work. Per the existing two-project-split decision (`docs/phase-a-product-plan.md` / Phase B), the Admin Dashboard is a separate app (`admin.stively.com`) — it would read this data via Prisma directly (same database, same schema, separate deployed app), not through a public API, consistent with how `stively-web` itself avoids an internal REST layer for its own data (`docs/phase-d-product-blueprint.md` §6).

**Sales module (future) assignment:** creates new `LeadAssignment` rows, updates `Lead.currentOwnerId` to match. The obvious future automation — round-robin assignment, workload-balanced assignment, or SLA-triggered auto-reassignment per the finalized reassignment rules — is explicitly not designed here (§9/§10 cover why), but the schema doesn't block it: an automated assignment system just needs to pick a `TeamMember.id` and insert a row, exactly the same operation the CEO/Founder's default assignment or a human dispatcher already performs.

**Notifications (future):** every `LeadHistory` insert and every new `Lead` creation is a natural trigger point. Concretely: new `Lead` → email to the relevant internal distribution list (Student leads to admissions, Business leads to sales) via the existing Resend integration (`src/lib/resend.ts`) — this needs no new infrastructure, just a new call site. Reassignment or status change → notify the newly assigned `TeamMember` directly, which this revision's schema now supports (v1.0 couldn't reliably notify "whoever is assigned" since assignment was optional; it's now guaranteed to exist).

**WhatsApp integration (future):** unchanged in mechanism from v1.0 — fits as both an acquisition channel (already modeled explicitly now via `AcquisitionChannel`, not just a hypothetical future `LeadSource` value) and, once the Business pipeline's `WHATSAPP_DISCUSSION` stage is real, as an active conversation channel logged via `LeadHistory` (`eventType: WHATSAPP_SENT`). It still does not need its own lead model or pipeline — it's a channel, not a lead type.

---

## 6. Automation

**Revised in v1.1** to include the mandatory default-ownership step and deduplication handling — both new requirements from this revision.

**Student submits form (new lead):**
1. Check for an existing `Lead` matching this email or phone with `leadType: STUDENT` (see §3 Deduplication). If found, skip to the "returning enquiry" flow below instead.
2. `Lead` created (`leadType: STUDENT`, `status: NEW`).
3. `LeadAssignment` created automatically, `ownerId` set to the CEO/Founder `TeamMember`, `reason: INITIAL` — every lead has an owner from the first moment it exists, per the finalized ownership rule.
4. `LeadHistory` row created (`eventType: LEAD_CREATED`).
5. Confirmation email to the student (via Resend) — "we got your message."
6. Internal notification to the current owner (once notification infrastructure exists).

**Business submits form (new lead):** identical shape to the above with `leadType: BUSINESS`.

**Returning enquiry (duplicate email/phone):**
1. Existing `Lead` found — no new row created.
2. `lastEnquiryAt` updated to now.
3. `LeadHistory` row created (`eventType: RE_ENQUIRY`) — the fact that they reached out again is itself useful signal (worth surfacing to whoever owns the lead), even though nothing else about the lead changes.
4. Existing `LeadAssignment` and all `LeadNote`s are left untouched, exactly as specified.

**Lead assigned / reassigned:**
1. Existing active `LeadAssignment` (if any) set to `isActive: false`.
2. New `LeadAssignment` row created with the new `ownerId` and the applicable `reason` (`SLA_BREACH`, `UNAVAILABLE`, or `MANUAL_OVERRIDE`).
3. `Lead.currentOwnerId` updated to match (see §3's denormalization reasoning).
4. `LeadHistory` row created (`eventType: REASSIGNED`) — unlike v1.0's original position that assignment didn't need a `LeadHistory` entry, the business's explicit request to expand `LeadHistory` into a full timeline (§3) now covers this too, since "Assigned" is explicitly named as a timeline event in the given example.
5. Notification to the newly assigned owner (once notification infrastructure exists).

**Lead converted:** `Lead.status` updated to `CONVERTED`, a `LeadHistory` row logs it (`eventType: CONVERTED`). As in v1.0: for a Student lead this is the handoff point where a real `Enrollment` gets created or linked; for a Business lead this is where a future `Project` entity would be created. This module's job stops at emitting that handoff signal — per the business decision's own framing, "future CRM workflow continues" from here, outside this module's ownership.

---

## 7. API Design

**Unchanged in substance from v1.0** — the WhatsApp webhook recommendation is now more concretely motivated (the Business pipeline has an explicit `WHATSAPP_DISCUSSION` stage, per §2), but the recommendation itself doesn't change.

**Lead submission stays a Server Action, not a new public API.** The existing `submitLead` action already establishes this, and `docs/phase-d-product-blueprint.md` §6 already made the general case for it (no internal REST layer for `stively-web`'s own data). Extending `submitLead` to accept `leadType`, the new ownership/priority/attribution fields, and a validated `metadata` payload is the correct evolution — not a new endpoint. The deduplication check (§3/§6) lives inside this same action, not a separate endpoint.

Route Handlers (real HTTP endpoints) are still the right call for the same narrow category already established in this project — genuine external-system integration, not internal data access:

| Endpoint | Purpose |
|---|---|
| `POST /api/webhooks/whatsapp` | Receives inbound WhatsApp messages/status updates once that integration exists — mirrors the existing `POST /api/webhooks/payment` pattern exactly. |
| `POST /api/leads/import` *(only if needed)* | Bulk-import leads from an external source (e.g., a spreadsheet, a trade-show list) — flagged as *possibly* needed, not recommended outright, since nothing in the current business reality confirms this is a real near-term need. |

**Explicitly not recommended:** a general-purpose `/api/leads` REST surface for the future Admin Dashboard to consume. If the Admin Dashboard is a separate Next.js app with direct Prisma access to the same database (per the existing two-project architecture), it doesn't need one. This recommendation should be revisited only if the Admin Dashboard ends up needing to be consumed by something that *isn't* a trusted first-party app with direct database access.

---

## 8. Permissions

**Simplified in v1.1, deliberately — not an oversight.** v1.0 included a detailed per-role CRUD table (what each role can read/write/reassign). This revision's instruction is explicit that the full permission system isn't ready to be designed yet — only which future roles are expected to use this module. Trimming to exactly that.

No auth model exists yet, so this is a list of expected consumers, not anything enforceable today:

- **CEO / Founder** *(the default `TeamMember` owner for every new lead, per §3)*
- **Sales / Salesperson** *(blueprint §5 entity — the role leads get reassigned to)*
- **Marketing** *(consumer of acquisition/UTM data for channel-ROI reporting, §3)*
- **System / Automation** *(the same non-human actor that already runs `submitLead` today, extended to handle deduplication, default assignment, and history logging)*

Mentor and Trainer are explicitly not included — leads are a Sales/Admin concern, and neither role has a function this module's data serves. The detailed access rules (who can reassign, who can see what) are deferred to whenever the full permission system is designed, per the instruction.

---

## 9. Future Expansion

**Core mechanism unchanged from v1.0; cost accounting updated to reflect the revised §2/§3 design.**

Adding **Mentor, Trainer, Partner, or Investor** as new lead types later requires, under this revised design:

1. Add the value to the `LeadType` enum (`MENTOR`, `TRAINER`, `PARTNER`, `INVESTOR`).
2. Add that type's pipeline stages to the shared `LeadStatus` enum (e.g., a Mentor lead's pipeline might be `NEW → ASSIGNED → SCREENING_CALL → INTERVIEW → APPROVED → CONVERTED` — new values, same enum, same reasoning as §3's wide-enum trade-off). This is new in this revision: v1.0's simpler shared-pipeline assumption meant a new lead type didn't need new status values, just new `metadata` fields. Now that Student and Business have genuinely distinct pipelines, a new lead type will too, and that pipeline needs representing the same way.
3. Define a new Zod schema for that type's `metadata` shape (e.g., a Mentor lead's metadata might hold expertise area and availability — exactly the fields already flagged as needed for the Mentor application form back in `docs/phase-e-visual-ux-planning.md`, which was never built).
4. Build the form/page for that type, submitting through the same `submitLead` action.

**Still no new table, no change to `LeadHistory`/`LeadAssignment`/`LeadNote`/`TeamMember`.** The cost of a new lead type grew slightly with this revision (now includes new enum values for its pipeline, not just a new `LeadType` value), but the core claim from v1.0 still holds: the cost is proportional to how different the new type's process actually is, not to the size of the CRM infrastructure underneath it, and nothing about adding one requires touching the ownership, history, or notes machinery.

One nuance carried over from v1.0, still unresolved: the existing `CAREERS` value in `LeadSource` (job applicants wanting to work *at* Stively) doesn't cleanly fit `STUDENT` or `BUSINESS`, and isn't in the finalized two supported types. Still recommending this be left as an explicit open gap rather than force-fit, pending a real decision if/when Careers volume grows enough to matter.

---

## 10. Risks

**Revised in v1.1** — one v1.0 risk (deduplication) is now resolved by this revision and removed; several new risks are added; two existing risks are updated to reflect what's now partially mitigated. One v1.0 risk (`metadata` JSON scalability) is unchanged and restated below.

**`metadata` JSON losing queryability at scale — unchanged from v1.0.** Mitigated by the explicit graduation path in §3 (this revision already exercised that path once, promoting `companyName` to a real column), but worth stating plainly: if Business-lead reporting on the remaining `metadata` fields (industry, budget, project type) becomes a daily operational need before a Sales/Analytics module exists to justify the schema work, this will feel like a real limitation before anyone gets around to fixing it. Not a reason to avoid the design — a reason to revisit it proactively once real usage data exists.

**Wide `LeadStatus` enum allows invalid type/status combinations at the database level.** Direct consequence of the §3 trade-off (one enum instead of two nullable columns) — nothing in Postgres stops a `STUDENT` lead from being written with `PROPOSAL_SENT`. This is mitigated by Zod validation at the `submitLead`/status-update boundary, but only as well as that validation is actually maintained — if a future code path writes to `Lead.status` without going through the validated path, this becomes a real, silent data-quality problem. Worth a deliberate note in implementation, not just in this document, when that code gets written.

**Deduplication scope assumption may be wrong.** §3 assumes uniqueness should be scoped to `[email, leadType]`, not `[email]` alone — meaning the same person can have one active Student lead and one active Business lead simultaneously, but not two active Student leads. This was inferred, not confirmed. If the actual intent is one lead per person *regardless* of type, the unique constraint and the dedup check in `submitLead` both need to change before implementation, not after.

**`TeamMember` is a shadow identity system that will need merging into real auth later.** Explicitly accepted in §3, restated here as a risk rather than just a design note: every `ownerId`/`assignedById`/`performedBy`/`authorId` reference created between now and when real authentication exists points at a `TeamMember` row, not a `User` row. That migration (merging or linking `TeamMember` to `User`) is a real piece of future work this design creates, not eliminates — flagging it now so it's budgeted for later, not discovered as surprise scope when auth finally gets built.

**Two open pipeline questions block a clean implementation.** §2 flags both: whether `NOT_RESPONDED` allows retry attempts (and how many before it's treated as lost), and whether the Business pipeline needs an explicit `LOST` status the given decision didn't include. Neither is this document's call to make unilaterally — both need an answer before the `LeadStatus` enum in §3 can be considered final.

**Spam and bot submissions — unchanged from v1.0, still unaddressed.** The current `submitLead` action has no rate limiting or bot-detection. Still a real, live risk independent of this architecture, not fixed or worsened by this revision.

**Assignment staleness — partially mitigated by this revision, not solved.** v1.0 flagged that leads could sit unassigned indefinitely without automation. The mandatory-ownership rule (§3) closes the *unassigned* gap entirely — every lead has an owner from creation, defaulting to the CEO/Founder. What's still unaddressed is staleness *after* assignment: the finalized SLA-breach reassignment rule (§3's `ReassignmentReason.SLA_BREACH`) implies an SLA exists, but this document doesn't define what that SLA actually is (how many hours/days before a lead counts as breached) or what detects it — that's a concrete open question for whoever implements this, not something resolved by the schema existing.

**Status/enum changes are real migrations, not free additions.** Now a larger version of the same v1.0 risk: this revision doesn't just add `QUALIFIED`/rename `CLOSED` (v1.0's concern) — it replaces the entire status model with two full pipelines' worth of new values, adds `TeamMember`, and makes `LeadAssignment.ownerId` non-nullable. Any existing `Lead`/`LeadAssignment` rows created under v1.0's design need an explicit backfill plan (mapping old statuses to new ones, creating a default `TeamMember` row and back-filling `ownerId` for existing leads) before this can be implemented against a database that already has data in it. Flagging this plainly: this is a bigger migration than v1.0's was, and should be scoped as its own step, not assumed to be automatic.

**Manual `AcquisitionChannel`/`LeadEventType` enums require a migration to extend.** Both are curated, bounded lists by design (§3) rather than free text, which is the right call for filtering/reporting — but it means adding a thirteenth acquisition channel or a new event type later is a schema change, not a config change. Acceptable given how infrequently these actually change in practice, but worth knowing the trade-off was made deliberately, not overlooked.

**~~No deduplication strategy~~ — resolved in this revision.** v1.0 flagged this as an open risk; §3/§6 of this revision now define a concrete mechanism (indexed lookup + `lastEnquiryAt` + `RE_ENQUIRY` history event). Removed as a standalone risk; the *scoping assumption* within that mechanism is still flagged above as its own, narrower risk.

**This design still assumes infrastructure that doesn't exist yet — narrowed, not removed, by this revision.** v1.0 flagged that `changedBy`/`assignedToId`/`authorId` being nullable meant nothing could be attributed to a real person without auth. This revision's `TeamMember` table narrows that gap — ownership and assignment *can* now be attributed to a real (if not authenticated) person — but `performedBy` on `LeadHistory` and `authorId` on `LeadNote` remain nullable, since a human using a future CRM UI to manually log an action still requires that UI (and likely real auth) to exist. Until then, this module can only be operated through direct database access or system automation, which is consistent with current business reality but still worth stating plainly.

**`CAREERS` lead source still doesn't fit the two supported types.** Unchanged from v1.0, restated because it remains unresolved — see §9.

---

## Version History

**v1.0 — Initial architecture proposal.**
First draft. Proposed a single shared `LeadStatus` enum (`NEW → CONTACTED → QUALIFIED → CONVERTED/LOST`) on the assumption both pipelines had the same shape, nullable assignment fields (no auth existed), a basic `LeadSource` enum with no attribution tracking, no priority field, and no deduplication strategy. `Lead`, `LeadHistory`, `LeadAssignment`, `LeadNote` proposed as the core model set.

**v1.1 — Architecture Review Complete. Implementation Pending.**
Revised against finalized business decisions:
- Replaced the shared lifecycle assumption with two explicit, structurally different pipelines (Student: branching after First Call; Business: linear discovery-to-development sequence) — §2.
- Consolidated both pipelines into one wide `LeadStatus` enum for database-level reasons, reversing v1.0's "two enums would be duplication" framing now that the pipelines are genuinely different shapes, not just different labels — §2/§3.
- Added `TeamMember` — a minimal, explicitly non-authentication roster table — to support the new mandatory-ownership rule (every lead has exactly one active owner, defaulting to CEO/Founder) — §3.
- Made `LeadAssignment.ownerId` required (was nullable in v1.0) and added `reason` to support the finalized reassignment rules (SLA breach, unavailability, manual override) — §3.
- Expanded `LeadHistory` from a status-transition log into a general chronological event timeline, per the finalized requirement — §3.
- Added `LeadPriority` (Low/Medium/High, deliberately unscored) — §3.
- Added `AcquisitionChannel` and UTM fields, and explicitly separated the "which form" concept (`LeadSource`, unchanged) from the "which marketing channel" concept (new) — §3.
- Added deduplication: indexed email/phone lookup, `lastEnquiryAt`, and a `RE_ENQUIRY` history event, replacing v1.0's flagged-but-unsolved risk — §3/§6, resolves a §10 risk from v1.0.
- Promoted `companyName` from `metadata` to a dedicated column, directly answering the instruction to review whether any JSON field should graduate — §3/§4.
- Simplified Permissions to a role list only, per explicit instruction not to design the full permission system yet — §8.
- Updated Future Expansion's cost accounting for new lead types to account for the wide-enum design — §9.
- Added new risks (wide-enum validity, dedup-scope assumption, `TeamMember`-to-`User` migration debt, two open pipeline questions) and updated two existing risks to reflect partial mitigation — §10.
- Flagged, not resolved: whether `NOT_RESPONDED` supports retry looping; whether the Business pipeline needs an explicit `LOST` status; whether deduplication should scope per lead type or globally.
