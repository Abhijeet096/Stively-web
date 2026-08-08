# Architecture Decisions

The permanent engineering handbook for Stively. Every major architectural decision — a real trade-off, not a routine implementation detail — gets recorded here before or as it's built. Numbered sequentially, never renumbered or deleted; a reversed decision gets a new entry that supersedes the old one, with a note added to the original.

---

## AD-001: Lead / SalesLead / OfferingRequest stay separate models

**Date:** 2026-08-03
**Problem:** Three models exist for "someone wants to talk to us" — `Lead` (inbound marketing/contact-form capture), `SalesLead` (outbound B2B sales pipeline), `OfferingRequest` (self-service catalog wizard). Surfaced as a suspected duplication during a full-platform architecture audit.
**Options considered:**
1. Merge all three into one `Lead` model with a `source`/`type` discriminator.
2. Keep separate, add/verify explicit bridges between them.
**Chosen solution:** Keep separate (option 2). Bridges already exist both directions: `OfferingRequest.promotedSalesLeadId`, `Business.promotedSalesLeadId`.
**Reason:** The three represent genuinely different shapes and lifecycles — inbound capture has no pricing/commission concept, `SalesLead` carries GST/installments/commission fields inbound capture will never need, `OfferingRequest` is scoped to a specific catalog `Offering` neither of the others are. Forcing one shape onto all three would mean nullable fields relevant to only one-third of rows, and a single status enum trying to represent three different pipelines.
**Trade-offs:** Three models to reason about instead of one; a developer new to the codebase has to learn which one applies where. Mitigated by thorough doc comments on each model explaining its scope and cross-referencing the others.
**Database impact:** None (no change) — this decision is a confirmation of existing schema, not a migration.
**API impact:** None.
**Future considerations:** If a fourth "someone wants to talk to us" shape is ever proposed, re-run this same test before creating a new model: does it have a materially different lifecycle/fields, or is it actually one of these three with a different entry point?
**Related components:** `prisma/schema.prisma` (`Lead`, `SalesLead`, `OfferingRequest`), `src/features/offering-requests/`, `src/features/sales-crm/`

---

## AD-002: Document generation — dynamic per-client PDFs only where per-client data actually varies

**Date:** 2026-08-03
**Problem:** The CEO's client-journey brief proposed ~25 document types (invoice, NDA, service agreement, welcome kit, company profile, handover doc, warranty certificate, training guide, maintenance brochure, etc.). Building all 25 as platform-generated PDFs would be a large, mostly-wasted investment.
**Options considered:**
1. Generate every document dynamically from the platform.
2. Design every document once in Canva, upload manually per client.
3. Split by whether per-client data actually varies.
**Chosen solution:** Option 3. A document is worth dynamic generation only if its content meaningfully differs per client/project (name, dates, amounts, project specifics). Otherwise it's designed once and reused via the existing manual-upload `ClientDocument` flow.
- **Dynamic (build):** Invoice, Payment Receipt, NDA, Service Agreement, Completion Certificate, Warranty Certificate, Welcome Kit (has real per-client merge fields: client name, PM, project ID, dates — corrected from an earlier pass that mis-scoped this as static).
- **Static/Canva, uploaded once (no new code):** Company Profile, Communication Guide, Training Guide, Maintenance Brochure, Referral Brochure.
- **Neither — real portal workflow, not a document at all:** Requirement Gathering Form (client fills in-portal, status Pending/Submitted/Approved), QA Report / UAT Checklist (interactive, client ticks off and approves), Change Request Form (real approval + repricing flow).
- **Skip:** Project Information Sheet (redundant with data already live on the Client Workspace dashboard header).
**Reason:** The marginal cost of a new dynamic-PDF template is low once the rendering engine exists (AD-003), so it's worth it wherever real data varies. Where nothing varies, dynamic generation is pure overhead for zero benefit over a single reusable static file.
**Trade-offs:** Static documents can't be dynamically searched, filtered, or reported on the way generated ones can — acceptable since none of the static-list items are ever transactionally reasoned about (no "find all invoices over ₹X" query will ever be needed against a Training Guide).
**Database impact:** None yet at decision time — see AD-003/AD-004 for the schema this implies once building starts.
**API impact:** None yet — see AD-003/AD-004.
**Future considerations:** Re-apply this same per-client-variance test to any new document type the business proposes, rather than defaulting to "let's generate it."
**Related components:** `src/features/client-workspace/` (`ClientDocument`, `ClientDocumentType`), future PDF template components.

---

## AD-003: PDF generation engine — `@react-pdf/renderer`, not a headless browser

**Date:** 2026-08-03
**Problem:** No PDF generation library exists in the codebase. Need one for AD-002's dynamic documents (invoice first).
**Options considered:**
1. Puppeteer/Playwright — render HTML/CSS via headless Chrome, print to PDF.
2. `@react-pdf/renderer` — pure-JS PDF composition from React components, no browser.
**Chosen solution:** `@react-pdf/renderer`.
**Reason:** The app deploys to Vercel serverless functions. Headless Chrome on serverless requires bundling a Chromium binary (`@sparticuz/chromium` or similar), adds real cold-start latency, and is a recurring source of "works locally, breaks in production" issues on this hosting model. `@react-pdf/renderer` has zero such dependency — it composes the PDF directly, matching this codebase's existing bias toward Vercel-native tooling (Next.js, `@next/third-parties`, Cloudinary for uploads rather than local file handling).
**Trade-offs:** Layout is done via a React-PDF-specific flexbox-like API, not real CSS — pixel-matching a reference design (the founder's invoice template) takes more careful measurement than "just copy the CSS." No support for some advanced CSS the founder's Canva exports might use (gradients, box-shadows) — will degrade gracefully to flat colors/borders where needed.
**Database impact:** None directly — enables AD-004.
**API impact:** New `"use server"` actions to generate + attach each document type, following the existing action patterns (Zod validation, role check, try/catch).
**Future considerations:** If pixel-perfect fidelity to Canva-designed layouts becomes a hard requirement, revisit Puppeteer despite the serverless cost — but only if `@react-pdf/renderer` genuinely can't achieve an acceptable result first.
**Related components:** New `src/lib/pdf/` (or similar) rendering layer, `src/features/sales-crm/` (invoice/receipt), future NDA/Service Agreement templates.

---

## AD-004: Invoice line items are entered manually at generation time, not sourced from `SalesQuote`

**Date:** 2026-08-03
**Problem:** The founder's invoice template shows itemized services with per-item discounts. No existing model (`SalesQuote`, `SalesProject`, `SalesProjectPayment`) stores line-item-level data — all three only track a lump-sum amount.
**Options considered:**
1. Add itemized line items upstream — extend `SalesQuote` (or a new model) to carry structured line items from the moment a quote is sent, and have the invoice read from there.
2. Admin enters/edits line items directly when generating each invoice, independent of any upstream quote structure.
**Chosen solution:** Option 2.
**Reason:** Founder's explicit call. Matches how invoicing actually happens in a real services business — the exact line-item breakdown is often finalized (and can legitimately differ from the original quote wording) at the moment of billing, not fixed at quote time. Avoids a schema change to `SalesQuote` that would ripple into the Proposal/Quote UI for a benefit (auto-populated line items) that's marginal against the cost of re-typing a handful of rows per invoice.
**Trade-offs:** No automatic consistency check between what was quoted and what's invoiced — relies on the admin doing this correctly, same as it would with a manually-issued invoice today. Revisit if invoice/quote mismatches become a real recurring problem.
**Database impact:** New structure needed to hold line items per generated invoice — likely a JSON field on the invoice-generation input/`ClientDocument` metadata rather than a new relational model, since line items are a write-once snapshot at generation time, not something later queried/filtered.
**API impact:** New `generateInvoice` action taking line items as input, producing a PDF, creating a `ClientDocument` (type `INVOICE`) exactly as the existing manual-upload flow does today — no new document-delivery mechanism, only a new document-authoring mechanism.
**Future considerations:** If `SalesQuote` ever grows real itemization for its own reasons (e.g., client-facing line-item quotes), reconsider whether invoice generation should default-populate from it while still allowing edits.
**Related components:** `SalesProjectPayment`, `ClientDocument`, new invoice-generation action + PDF template.

---

## AD-005: Client Success Dashboard is a consolidation of existing data, not a new subsystem

**Date:** 2026-08-03
**Problem:** CEO proposed a "Client Success Dashboard" (project health, payments, milestones, documents, approvals, messages, meetings, warranty, support, completion %) as a new feature.
**Options considered:**
1. Build as a new set of models/queries.
2. Audit what already exists first, build only the gap.
**Chosen solution:** Option 2. Audit found `SalesProject.progressPercent`, `warrantyExpiresAt`, `ProjectMilestone` (ordered timeline), `ProjectUpdate` (progress posts), and `SalesProjectPayment` (paid/pending) already live in the Client Workspace. The real gap is only: an explicit "Project Health" traffic-light status field, and consolidating already-shipped pieces onto one summary view instead of scattering them.
**Reason:** Directly avoids the exact failure mode the CEO flagged — "20 new pages" instead of "one beautiful dashboard." Building new models for data that already exists would itself become the next entry in this file's "why do we have two of these" category.
**Trade-offs:** None identified — this is a strict improvement (less code, same or better outcome).
**Database impact:** One new field likely needed (`SalesProject.healthStatus` enum: ON_TRACK / AT_RISK / COMPLETED, admin-set like `progressPercent` already is).
**API impact:** Consolidation of existing queries into one dashboard-summary query rather than new endpoints.
**Future considerations:** "Support Tickets" from the CEO's list has no existing home — before building a new ticketing subsystem, check whether the existing `SalesLeadMessage`/chat feature can serve this need first.
**Related components:** `src/features/client-workspace/`, `SalesProject`, `ProjectMilestone`, `ProjectUpdate`.

---

## AD-006: Requirement Gathering, QA, and UAT are portal workflows, not documents

**Date:** 2026-08-03
**Problem:** CEO's original brief specified these as PDF-style documents (a form, a report, a checklist).
**Options considered:**
1. PDF/document, filled and uploaded manually.
2. Real in-portal form/workflow with structured data and status tracking.
**Chosen solution:** Option 2 for all three.
**Reason:** Each has an explicit status lifecycle in the CEO's own spec (Pending/Submitted/Approved for the requirement form; bugs found/fixed/pending for QA; client-ticks-and-approves for UAT) — that's a workflow with state, not a static artifact. A PDF can't be queried, can't drive a notification when status changes, and re-introduces exactly the "no WhatsApp, everything through the portal" problem this whole initiative is meant to solve.
**Trade-offs:** More build effort than a document (real form UI, a table, a review flow) versus "upload a filled-in template." Justified by the same reasoning as AD-002 — real per-client structured data belongs in the database, not trapped in a PDF.
**Database impact:** New models needed for each (deferred — not yet scoped in detail; each is its own future architecture decision when actually built).
**API impact:** New CRUD-style actions per workflow, following existing action patterns.
**Future considerations:** When these are actually scoped for implementation, this entry should be superseded by three more specific ADRs (one per workflow) covering their actual schema.
**Related components:** Future `RequirementForm`, `QAReport`/`Bug`, `UATChecklist` models (none exist yet).

---

## AD-007: Architecture freeze until first clients close

**Date:** 2026-08-03
**Problem:** After the platform audit (AD-001 through AD-006), there's a real risk of continuing to plan/build indefinitely instead of converting the P1 list into actual closed deals. Momentum toward "more architecture work" needs an explicit stop condition.
**Options considered:**
1. Keep building P1–P4 roughly in order, no formal constraint.
2. Freeze scope explicitly: only P1 items, client-acquisition work, UX/bug/perf fixes, and SEO/marketing until first clients close.
**Chosen solution:** Option 2.
**Reason:** The entire point of the audit and governance files (ARCHITECTURE_DECISIONS.md, ROADMAP.md, TECH_DEBT.md, SOP.md, PRODUCT_PRINCIPLES.md, BRAND_PRINCIPLES.md) was to stop trading "more features" for "a coherent system." A freeze with a real, sales-focused exit condition (first clients closing) prevents the audit itself from becoming the next thing that quietly expands scope instead of shipping.
**Trade-offs:** P2–P4 items with real value (Requirement Form, Handover Document, Welcome Kit) will sit longer than they otherwise might. Accepted — none of them are blocking a deal from closing today; P1 already covers what is.
**Database impact:** None directly — this is a scope-control decision, not a technical one.
**API impact:** None.
**Future considerations:** Revisit this freeze explicitly once the first client closes, rather than letting it quietly lapse. The condition for lifting it should be named in the same place it was declared (ROADMAP.md's "Current focus window" banner) so it's obvious when it's been met.
**Related components:** ROADMAP.md, PRODUCT_PRINCIPLES.md #12.

---

## AD-008: Document Generation Engine — reusable platform component, not an Invoice Generator

**Date:** 2026-08-03
**Problem:** Phase 1 was originally scoped as "build an invoice generator." Before implementation, the founder redirected this to a reusable engine for every future generated document (Invoice, Receipt, NDA, Service Agreement, Welcome Kit, Completion Certificate, Warranty Certificate), with three specific additions: a document lifecycle, centralized document numbering, and immutable versioning.
**Options considered:**
1. Build an invoice-specific generator now, generalize later when a second document type is needed.
2. Build the shared engine + registry pattern now, since 7 concrete document types are already on the roadmap (not hypothetical).
**Chosen solution:** Option 2.
**Reason:** With 7 known consumers already identified, this isn't premature abstraction - it's building the abstraction at the point real, known need justifies it (PRODUCT_PRINCIPLES.md #6). A template registry (`src/features/documents/lib/registry.ts`) maps a `DocumentType` string key to `{schema, component, numberPrefix, clientDocumentType}` - adding NDA/Service Agreement/etc. in P2 means one new registry entry + one template file, zero changes to the rendering engine, numbering service, or storage layer.
**Trade-offs:** More upfront build than a single-purpose invoice generator - justified by the confirmed P2 document list, not a bet on hypothetical future need. `DOCUMENT_TEMPLATES`'s value type needs one narrow, explained `any` (function-parameter contravariance across a heterogeneous map of concretely-typed entries) - real type safety still enforced twice: once at each entry's own declaration, once at runtime via `entry.schema.parse()` before a template ever sees data.
**Database impact:** Extended `ClientDocument` (not a new parallel model - see reasoning below) with `templateType` (plain string, not a Prisma enum, so new document types never require a migration), `documentNumber`, `lifecycleStatus`, `version`, and a self-relation `supersedesId`/`supersededBy` for the version chain. New `DocumentSequence` model `{type, year, lastNumber}` for atomic, race-safe numbering (same upsert+increment pattern as `claimLead`/commission generation).
**API impact:** `src/features/documents/server/generate.ts`'s `generateDocument(type, data, context)` is the one place data-collection → template-rendering → PDF-generation → storage → delivery gets wired together, document-type-agnostic. `src/features/documents/actions/invoice-actions.ts` is the one type-specific admin-facing action in this pass (line items are admin-authored - AD-004); `src/features/documents/server/receipt-trigger.ts` is called internally from both payment-confirmation paths (`markPaymentPaid`, `verifyProjectPayment`), never admin-triggered directly, since Receipt has no Draft/review step.
**Why extend `ClientDocument` instead of a new model:** A generated invoice and a manually-uploaded welcome kit are still the same underlying concept - a document the client sees in their portal. A parallel `GeneratedDocument` model would recreate the exact "five near-identical tracking tables" problem AD-001's audit flagged. The new fields are simply unused (null/default) for manually-uploaded rows.
**Lifecycle:** `DocumentLifecycleStatus` (DRAFT/GENERATED/SENT/VIEWED/ACCEPTED/REJECTED/ARCHIVED) exists on every document, but Invoice/Receipt in this pass only ever move GENERATED→SENT→(ARCHIVED if superseded) - generation is delivery in the current UX, there's no separate review/send step yet. Accepted/Rejected/Viewed become meaningful once NDA/Service Agreement (P2) need a real "client signs or declines" step.
**Versioning:** Regenerating a document (same salesLead + templateType + relatedPayment) creates a new row (`version + 1`, `supersedesId` pointing at the old row) and flips the old row to ARCHIVED in the same transaction - the old PDF is never deleted or overwritten, only excluded from client-facing queries (`lifecycleStatus: { not: "ARCHIVED" }`, added to `getClientWorkspaceById`/`getClientPayments` in `client-workspace/server/queries.ts`).
**Numbering, one judgment call worth flagging:** Each regeneration gets a **new** document number (INV-2026-00001 → INV-2026-00002 on correction), not the same number at a new version. This matches real invoicing/audit practice (every number should map to exactly one immutable PDF forever, so a bank reconciliation or tax reference is unambiguous) - but it does mean "version 2 of an invoice" and "invoice number 2" are different, easily-conflated concepts. If same-number-across-versions is preferred instead, it's a small change to `generateDocument` (reuse `previous.documentNumber` instead of calling `nextDocumentNumber` when a `previous` row exists).
**Fonts:** `@react-pdf/renderer` can't use `next/font` (no browser, no CSSOM) - the engine embeds real static Geist weight files (Regular/Medium/SemiBold/Bold, SIL OFL licensed, sourced from Vercel's own geist-font repo) rather than falling back to a generic PDF font. Bricolage Grotesque (the site's display face) only ships as a variable font with no static weights, which `@react-pdf/renderer` handles less predictably - Geist alone for documents, which are utilitarian rather than marketing pages, was the right trade rather than risking inconsistent weight rendering.
**Colors:** Brand OKLCH tokens from `globals.css` resolved to hex once (verified against the `culori` library, not hand-trusted) and hardcoded in `lib/theme.ts` - a printed PDF isn't theme-aware, light-mode values only, regardless of the viewer's OS theme.
**Known gap, not a code bug:** Real end-to-end test (generate → upload → download) found Cloudinary returns 401 (`x-cld-error: deny or ACL failure`) on the generated PDF's public URL, despite Cloudinary's own metadata confirming the file is valid (correct A4 dimensions, correct byte size). This is a Cloudinary **account security setting** ("Restricted media types" / PDF+ZIP delivery), not a bug in the upload or generation pipeline - **action item for the founder**: enable PDF/ZIP delivery in the Cloudinary dashboard's security settings before this goes live, or every generated document will 401 for real clients.
**Future considerations:** NDA/Service Agreement (P2) will need a real signature-acceptance step (typed name + timestamp, not DocuSign-grade - already flagged in ROADMAP.md) - that's the first template that will actually exercise SENT→VIEWED→ACCEPTED/REJECTED, worth its own ADR when built.
**Related components:** `src/features/documents/**` (new), `prisma/schema.prisma` (`ClientDocument`, `DocumentSequence`, `DocumentLifecycleStatus`), `src/features/sales-crm/actions/payment-actions.ts`, `src/features/client-workspace/actions/payment-actions.ts`, `src/features/client-workspace/server/queries.ts`.

---

## AD-009: Live notification delivery via polling, not WebSocket/SSE

**Date:** 2026-08-06
**Problem:** Google Ads is going live on `/start-project`; a lead arriving needs to be noticed fast. The existing `Notification` system only ever fetches once, at layout render - someone already sitting on a dashboard page sees nothing new until they manually navigate/refresh. Also surfaced a second, bigger gap while investigating: the `/admin` dashboard (where this actually needs to show up) had no notification bell at all - it was running on an older, separate sidebar shell (`src/components/dashboard/sidebar.tsx`) that predates the richer `DashboardShell`/`Topbar` system every other role's portal already uses.
**Options considered:**
1. WebSocket server (e.g. a custom Node server, or a hosted service like Pusher/Ably) for real push delivery.
2. Server-Sent Events via a Vercel streaming function.
3. Client-side polling against a new `getRecentNotifications` server action.
**Chosen solution:** Option 3 - 15-second polling.
**Reason:** Vercel serverless functions don't hold a persistent connection well (WebSocket needs a long-lived process this hosting model doesn't provide without extra infrastructure; SSE works but ties up a function for the connection's duration and adds real complexity for a need that isn't sub-second). A lead notification needing to be seen "within a few seconds" doesn't justify a new infrastructure dependency (Principle #6, reuse before inventing) - a plain interval + existing server action is the simplest thing that actually satisfies "hear about it without a manual refresh."
**Trade-offs:** Up to 15s latency (acceptable for this use case) instead of instant push. Every open dashboard tab polls independently - fine at current scale, would need a shared/deduped approach (or revisiting Option 1/2) if concurrent admin sessions ever became large enough for the polling traffic itself to matter.
**Database impact:** None - reuses the existing `Notification` model and `getNotificationsForUser` query as-is.
**API impact:** New `getRecentNotifications` server action (`src/features/notifications/actions/notification-actions.ts`) - read-only, `requireUser()`-gated like every other action in that file.
**Future considerations:** If real-time (<1s) delivery is ever genuinely required, revisit SSE first (less infrastructure than a websocket service) before reaching for a third-party push provider.
**Related components:** `src/components/dashboard-shell/notifications/notification-dropdown.tsx`, `src/lib/notification-sound.ts` (synthesized Web Audio chime, no external asset), `src/config/navigation/admin.ts` (populated with the real Founder CRM nav, previously a placeholder stub), `src/app/(dashboard)/layout.tsx` (migrated onto `DashboardShell`, old `src/components/dashboard/sidebar.tsx` removed).

---

## AD-010: Offering catalog seeded from already-public pricing, not invented

**Date:** 2026-08-07
**Problem:** Pre-launch client-dashboard audit (day before Google Ads go live) found `Offering` had **zero rows in the production database**. This wasn't just a client-dashboard issue - `/website-development`'s real pricing section (`getOfferingForDisplay("startup-website-package")`) was silently rendering nothing on a page direct ad traffic would hit, the entire client-portal self-service catalog (`/client/offerings`, dashboard's "Explore offerings"/"Our services", the admin lead-detail service-selection checklist) had nothing to show, and the request-proposal wizard had nothing to request against. Likely cause: every earlier session that built Offering-dependent features tested against temporary rows created and properly cleaned up afterward (per [[feedback_verification_discipline]]) - correct discipline for test data, but nobody separately seeded real, permanent catalog rows for production.
**Options considered:**
1. Build a full admin CRUD UI for managing Offerings, then have the founder populate it manually.
2. Seed the 3 tiers already public and founder-approved on `/pricing` (`src/lib/pricing.ts`, itself commented "exact tiers/pricing/inclusions as given by the client - not altered") as real `Offering` rows.
**Chosen solution:** Option 2 (`prisma/seed-offerings.ts`).
**Reason:** Option 1 is real, legitimate future work (see ROADMAP.md) but is a new module under the current architecture freeze (AD-007) and wasn't blocking tomorrow's launch by itself - the missing *data* was the actual fire. Seeding already-public numbers is safe (not inventing anything - `/pricing`'s own doc comment establishes these are the founder's real, approved figures) and fixes every downstream symptom immediately.
**Trade-offs:** These 3 Offering rows can now only be edited via re-running the seed script or a direct DB edit until admin CRUD (option 1) gets built - acceptable short-term, not a permanent state.
**Database impact:** 3 new `Offering` rows (`startup-website-package`, `business-website-package`, `enterprise-solution`), `status: PUBLISHED`, `audience: BUSINESS`, `visible: true`.
**API impact:** None - existing queries (`getOfferingForDisplay`, `getOfferingsForAudience`) already expected this shape, they just had nothing to return.
**Future considerations:** Build the admin CRUD UI (ROADMAP.md) once catalog changes need to happen more often than "re-run a seed script." Until then, any pricing change on `/pricing` must be manually mirrored into `prisma/seed-offerings.ts` and re-run - the two are not automatically kept in sync.
**Related components:** `prisma/seed-offerings.ts`, `src/lib/pricing.ts`, `src/app/(marketing)/website-development/page.tsx`, `src/app/(portal)/client/offerings/`, `src/app/(portal)/client/dashboard/page.tsx`.

---

## AD-011: Google Ads "Start Project Lead" conversion fires via explicit `gtag` event, not automatic form detection

**Date:** 2026-08-08
**Problem:** The "Start Project Lead" conversion action (`AW-17718751960/4kRyCOyJ3t0cENjl-oBC`) showed "Misconfigured" in Google Ads. Diagnosed live (real form submission, dataLayer inspected mid-flow): the action was configured for Google Ads' automatic "form submission" detection (Event: "Form submission: thank-you"), and the real `gtm.formSubmit` event for this form came through marked `gtm.formCanceled: true` - because `/start-project`'s form uses React's Server Action pattern (`<form action={formAction}>`), which necessarily intercepts the native submit event to route it through JS. Google's automatic detector has no way to distinguish "intercepted and handled by a framework" from "genuinely cancelled," so it never linked a real, successful submission to reaching `/thank-you`, despite the funnel completing correctly every time (confirmed: `gtm.historyChange-v2` fired correctly for the client-side `/start-project` → `/thank-you` `pushState` navigation - GA4/gtag's own SPA tracking is not the problem).
**Options considered:**
1. Keep automatic form-submission detection, try to make the native submit event look "uncancelled" to Google's heuristic.
2. Fire the conversion explicitly from code (`gtag('event', 'conversion', ...)`) on `/thank-you`'s real success path.
**Chosen solution:** Option 2.
**Reason:** Option 1 isn't reliably achievable without abandoning the Server Action form pattern this codebase uses everywhere - not worth destabilizing a working, established form architecture to appease one third-party heuristic. Explicit event firing is deterministic, fully within our control, and is the standard, recommended approach for SPA/React conversion tracking generally (this exact `gtm.formCanceled` failure mode is a known, common friction point with Google's automatic detection on any JS-framework form, not specific to this app).
**Trade-offs:** `/thank-you` has no server-side proof a real submission occurred (it's a plain public route, `noindex` only keeps search engines from listing it - a direct/bookmarked/crawled visit is fully reachable). Mitigated with a same-tab-only sessionStorage handoff (`src/lib/conversion-tracking.ts`) set by the form immediately before `router.push`, consumed (read once, then cleared) by the conversion-firing component - a direct visit finds nothing to consume and fires nothing. Not cryptographically unspoofable, but matches the level of rigor this class of tracking actually needs (deterring accidental/curious direct visits, not a security boundary).
**Database impact:** None.
**API impact:** None - purely client-side. No change to `submitStartProjectLead`, validation, or the redirect itself.
**Future considerations:** If other conversion actions (Purchase, Sign-up) hit the same automatic-detection failure mode - likely, since they'd observe the same Server-Action-intercepted form pattern - apply this identical fix: explicit `gtag('event', 'conversion', ...)` on that flow's real success path, gated the same sessionStorage-handoff way. `conversion-tracking.ts`'s key constant is scoped to this one flow (`START_PROJECT_CONVERSION_KEY`) - a second flow needs its own key, not a shared one, so two conversions in flight in the same tab can't cross-fire each other's event.
**Related components:** `src/lib/conversion-tracking.ts` (new), `src/components/analytics/start-project-conversion.tsx` (new), `src/components/forms/start-project-form.tsx`, `src/app/(marketing)/thank-you/page.tsx`.

---

*Template for new entries — copy this block:*

```markdown
## AD-XXX: <short title>

**Date:**
**Problem:**
**Options considered:**
**Chosen solution:**
**Reason:**
**Trade-offs:**
**Database impact:**
**API impact:**
**Future considerations:**
**Related components:**
```
