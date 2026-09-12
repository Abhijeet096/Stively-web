# Roadmap

The single source of truth for what's shipped, what's planned, and where everything stands. Every item gets a status:

`Planning` → `Approved` → `In Development` → `Testing` → `Completed` → `Released`

Update this file's status field the moment an item's state actually changes — don't let it drift out of sync with reality.

---

## Current focus window (set 2026-08-03)

**Architecture freeze until first clients close.** Only work that falls into one of these categories gets built right now:
- Critical P1 items below
- Anything that directly helps close the first clients
- UX fixes, bug fixes, performance
- SEO and marketing

No new major modules unless they directly help acquire, serve, or retain a client. See ARCHITECTURE_DECISIONS.md AD-007 for the reasoning.

---

## Released

Shipped in prior sessions, listed here for context — not re-litigated unless something breaks.

| Item | Status |
|---|---|
| AI Sales Workspace (CRM core: leads, quotes, proposals, projects, payments, commission) | Released |
| Client Workspace (portal, Razorpay payments, documents, progress, timeline, RBAC) | Released |
| Sales negotiation loop (in-portal quotes, meetings, chat) | Released |
| Offering Request → Sales CRM bridge (self-service clients get full Client Workspace on quote approval) | Released |
| Uber-style lead claim system (`/sales/inbound`, race-safe claim, notifications) | Released |
| Portfolio / case-study system (`/work/[slug]`, admin CRUD) | Released |
| AI interview integrity system (fullscreen/tab-switch enforcement, webcam recording, 2-strike termination) | Released |
| `/process` deepened (per-stage timeline/deliverables, process-specific FAQ) | Released |
| `/start-project` trimmed to 4 essential fields, form-above-fold on mobile | Released |
| Microsoft Clarity via official `@microsoft/clarity` SDK (replaced hand-rolled snippet) | Released |
| Homepage hero padding / performance pass | Released |
| Document Generation Engine (`src/features/documents/`) - lifecycle, versioning, central numbering, template registry | Released |
| Invoice + Receipt generation on the engine above | Released |
| Admin dashboard migrated onto the shared `DashboardShell` (search/notifications/theme/profile) - previously a bare sidebar with none of it; old `src/components/dashboard/sidebar.tsx` removed | Released |
| Live notification polling + sound (`notification-dropdown.tsx`, 15s poll, synthesized Web Audio chime) | Released |
| Google OAuth default role fix - `/login`'s Google button had no role context at all, silently created every such sign-up as STUDENT; now defaults to CLIENT/business, matching site positioning | Released |
| `/start-project` email field restored (optional, not required) so acknowledgement emails can go out - the existing `if (lead.email)` gate on `notifyNewLeadCreated` just needed the data available again | Released |
| Student LMS certificate generation + public verification (`src/features/certificates/`) - the existing unused `Certificate` model extended, on-demand PDF rendering (no object storage), `DocumentSequence` reused for numbering, `/verify/[certificateId]` public page, `/admin/certificates` management, GenAI course certificate preview - built as AD-007 freeze exception (see AD-019) since "Certificate included" was already sold copy with zero fulfillment | Released |
| Course & Product Sales dashboard (`src/features/course-sales/`) - replaces the dead `admin/reports` placeholder with real revenue/enrollment data read directly off `Order`/`OfferingEnrollment` (KPIs, monthly revenue chart, per-offering breakdown, per-offering buyer list with progress/certificate status); built as an AD-007 freeze exception (see AD-020), confirmed with the founder first since (unlike certificates) it's an internal ops need, not an already-sold promise | Released |
| Real `Offering` catalog seeded (`prisma/seed-offerings.ts`) - the table had **zero rows in production**, silently breaking `/website-development`'s pricing section, the entire client-portal self-service catalog, and the admin lead-detail service-selection list. Pricing/features copied verbatim from `src/lib/pricing.ts`, not invented. | Released |
| Client-portal nav duplication fixed - "Offerings"/"Our Services"/"Request Proposal" were three separate nav entries all pointing at the identical `/client/offerings` URL; collapsed to one | Released |
| Full quote -> notify -> accept flow verified end-to-end with real data (admin sends quote -> client gets email + in-app notification -> client accepts in portal -> salesperson would be notified back) - confirmed already correctly built, no changes needed | Released |
| Google Ads conversion tag installed sitewide (`AW-17718751960`) - reuses the already-loaded GA4 gtag.js rather than a second script load. CSP had to be widened (`connect-src`/`img-src`: `www.google.com`, `www.google.co.in`, `ad.doubleclick.net`) - confirmed via a real browser test that the tag "installs" and calls `gtag('config', ...)` fine without this, but every actual telemetry beacon it sends gets silently CSP-blocked, meaning conversion data would report zero despite looking installed. | Released |
| Cloudinary "Restricted media types" setting enabled by the founder - re-verified end-to-end with a real generated invoice: download now returns 200/`application/pdf` with an exact byte match, was 401 before. | Released |
| "Start Project Lead" Google Ads conversion (`AW-17718751960/4kRyCOyJ3t0cENjl-oBC`) now fires reliably and confirmed via a real production submission's `performance.getEntriesByType("resource")` entries (not just dataLayer contents) - two root causes, both fixed: (1) Google's automatic form-detection read React's Server-Action-intercepted submit as cancelled, replaced with an explicit `gtag('event', 'conversion', ...)` call; (2) that call was executing correctly the whole time (proven via console logging) but its actual beacon to `www.googleadservices.com`/`googleads.g.doubleclick.net` was silently CSP-blocked - those two domains weren't in the original CSP widening, which only covered the base config tag's `www.google.com`/`.co.in`/`ad.doubleclick.net`. See AD-011. | Released |
| Real bank details wired into `company-info.ts` (SBI, account/IFSC) - founder-confirmed 2026-08-08. UPI ID still not provided; the invoice template now renders that line conditionally rather than ever showing a placeholder on a real document. | Released |
| Critical/high CVEs from a full site security audit patched (`next-auth`/`@auth/core`/`@auth/prisma-adapter` to their fixed versions, `next` to 16.3.0) - none were the cause of a Google Ads "Compromised site" disapproval (that audit found no actual compromise anywhere in the served site; likely a false positive, appealed separately), but genuinely worth closing regardless. Also removed two root-level scratch scripts with hardcoded plaintext credentials for a `SUPER_ADMIN` test account, committed to source control - never executed against production, but real hygiene debt. Verified via a real login smoke test (correct + wrong credentials, role-based redirect) post-upgrade. | Released |
| Pre-conversion lead meeting scheduling + 30-minute reminder (`LeadMeeting`, `/api/cron/meeting-reminders`) - schedule the first-touch call directly from a raw Lead's admin page, get reminded before it starts. Fixes the same missing-reminder gap on the existing `SalesLeadMeeting` for free (same cron, two tables). See AD-012. | Released |
| About page rewritten pure-B2B (student/training/hiring-pipeline framing removed, trust-focused process/differentiators copy) - see AD-013's B2B_ONLY_MODE. | Released |
| Qualified Client system (AD-015) - `Lead` → `SalesLead` qualification bridge (auto-fires on BUSINESS lead status → CONVERTED/"Qualified", dedupes by email/phone), multi-project support (`SalesProject` 1:many per client, own name/type/priority), client-fillable Discovery & Requirements Form (`DiscoveryForm`, token-linked public page + authenticated client tab, admin send/resend/review panel), "Clients only" quick-filter on the Sales CRM Leads list. | Released |
| Qualified Client system - 4 pre-launch fixes from a founder review (AD-016): qualification notifications now always reach every admin (not just an assignee); the dedupe check on qualification is now concurrency-safe (Serializable isolation + retry) rather than a check-then-act race; discovery-form expiry is now a real persisted status and "Resend" issues a genuinely new token/link instead of re-mailing a dead one; the Leads list is reframed as "Qualified Clients" showing every promoted SalesLead by default, with Qualified/Proposal Sent/Negotiating/Won/Lost quick-filter chips replacing the old WON-only toggle. | Released |
| Token-based client invite links (AD-017), closing the "client ends up with two disconnected accounts" gap the founder identified: admin generates a real invite link (or it's auto-attached to a quote email when there's no portal account yet), the client sets their own password at /invite/[token] and is signed straight into their dashboard - replacing the old password-reset-email provisioning hack. Plus two soft (prefill-and-explain, never lock) identity carry-overs: /start-project prefills a logged-in client's email, and /register prefills + Google-hints the email from a recent contact-form/start-project submission on the same browser. | Released |
| Client Onboarding Form (AD-018) - from a real Claude Design handoff, project-scoped post-approval kickoff form (company/billing, project scope confirmation, brand asset uploads, technical access, content uploads, communication preferences, start-date approval). Admin sends it with one click from a project's own page; client fills it via a public token link or the client-portal "Onboarding" tab, including real file uploads to Cloudinary; admin reviews the response and marks it reviewed. Same token/status/notify architecture as DiscoveryForm (AD-015). Verified end-to-end with real data: real login, real send, real public-page submission with a real uploaded file, real admin notification, real "mark reviewed," real client-portal reflection - all test data cleaned up afterward. | Released |

---

## ⚠️ Action needed before the above goes live for a real client

**Signature image** (`src/features/documents/assets/signature-abhijit.png`): still a generated placeholder. The founder has shared the real one twice now as an inline chat image, which isn't a file I can save to disk - only files referenced via `@"path"` (the way the brand-kit PDFs were shared) become readable. Needs the real file sent that way, or its path if it's already saved somewhere.

**UPI ID** (optional): not provided - `company-info.ts`'s `upiId` field is `undefined`, and the invoice template already handles that gracefully (omits the line rather than printing a placeholder). Add it whenever convenient, not blocking.

**Meeting reminders need an external cron ping configured** (see AD-012) - the `/api/cron/meeting-reminders` endpoint exists and is verified working, but nothing calls it yet in production. Sign up free at cron-job.org (or similar), point it at `https://www.stively.com/api/cron/meeting-reminders` every 5 minutes, with header `Authorization: Bearer <CRON_SECRET value from Vercel's env vars>`. Until this is set up, meetings can be scheduled and viewed normally, but no reminder will fire.

---

## P1 — Before first client

| Item | Status | Business Value | User Impact | Notes |
|---|---|---|---|---|
| Payment marked PAID → client notification | Planning | High | High | Receipt auto-generation is done (see Released above) - the notification-to-client half of this item is still open. |
| Won lead → Project: pull `totalValue` from the accepted `SalesQuote` | Planning | Medium | Low | Removes a real mismatch/typo risk; invisible to the client. |
| Rate limit login / forgot-password / resend-verification | Planning | High | Low | Prevents a real, live exploit; invisible to legitimate users. |
| Audit log entries on payment verification actions | Planning | Medium | Low | Compliance/trust infrastructure, not client-visible. |
| Notify admin on new self-service `OfferingRequest` submission | Planning | High | Medium | Prevents silently losing a lead; faster response for the client. |
| Notify recruiter when an interview is completed/scored | Planning | Medium | Low | Internal-only. |

## P2 — After 5 clients

| Item | Status | Business Value | User Impact | Notes |
|---|---|---|---|---|
| NDA + Service Agreement generation, click-to-accept signature | Planning | High | Medium | Legal protection + trust; typed-name signature, not DocuSign-grade. |
| Requirement Gathering Form (real portal workflow) | Planning | High | High | Client-facing, replaces manual/WhatsApp intake. |
| Handover Document | Planning | High | High | Real delivery need, structured form → PDF. |
| Welcome Kit generation | Planning | Medium | High | First impression right after payment. See AD-002 correction. |
| Completion Certificate + Warranty Certificate | Planning | Medium | Medium | Cheap once the invoice engine exists. |
| Project → COMPLETED: auto-start warranty, fire feedback-request | Planning | Medium | Medium | Both currently fully manual/disconnected. |
| Wire `PROJECT_PAYMENT_DUE` notification to actually fire | Planning | Medium | Low | Enum already exists, never triggered. |
| Broaden audit logging to role assignment + document deletion | Planning | Medium | None | |
| Merge `admin/businesses` + `admin/leads` into one page | Planning | Low | None | Same component today, two nav entries. |
| Bind interview candidate actions to a per-session token | Planning | Low–Medium | Low | Security hardening. |
| Upload validation: check MIME/extension, not just size | Planning | Low–Medium | None | Security hardening. |
| Fold `lead-intelligence/runs` + `sales-crm/commission` into widgets | Planning | Low | None | Internal UX only. |
| Investigate retiring legacy `Enrollment`/`Program` | Planning | Low | None | Needs scoping before any migration decision. |

## P3 — After 25 clients

| Item | Status | Business Value | User Impact | Notes |
|---|---|---|---|---|
| Client Success Dashboard consolidation (`healthStatus` field + unified view) | Planning | High | High | See AD-005. |
| QA Report / UAT Checklist (real workflow) | Planning | Medium | Medium | See AD-006. |
| Change Request Form (real approval + repricing workflow) | Planning | Medium | Medium | See AD-006. |
| AI: weekly `ProjectUpdate` digest, meeting-minutes drafting | Planning | Medium | Medium | Reuses the existing Groq pipeline. |
| Consolidate the 5 near-identical activity-log tables | Planning | Low | None | See TECH_DEBT.md. |
| Resolve dead notification enum values | Planning | Low | None | |
| Merge near-duplicate priority enums | Planning | Low | None | |

## P4 — Enterprise, 100+ clients

| Item | Status | Business Value | User Impact | Notes |
|---|---|---|---|---|
| Broader AI-driven lead triage across inbound `Lead`/`OfferingRequest` | Planning | Medium | None | Reuse the lead-intelligence scoring pipeline. |
| Formal compliance-grade audit trail | Planning | Low | None | Only if an enterprise client actually asks for one. |
| Revisit CSP `frame-src`/`media-src: https:` looseness | Planning | Low | None | Currently intentional (embed escape-hatch). |

## Deferred — needs the founder's input, not engineering judgment

| Item | Status | Notes |
|---|---|---|
| SALES_PLAYBOOK.md (cold calling, discovery questions, objection handling) | Not started | Needs real sales knowledge only the founder/team has — not something to draft from the codebase. |
| CLIENT_PLAYBOOK.md (onboarding, communication standards, escalation) | Not started | Same. |
| HIRING_PLAYBOOK.md (recruitment, interview process, evaluation criteria) | Not started | Same. |
| MARKETING_PLAYBOOK.md (content strategy, SEO, social, case studies) | Not started | Same. |
| FINANCE_PLAYBOOK.md (invoicing, collections, refunds, commission rules) | Not started | Same. |

---

*To add an item: pick the right priority tier (see PRODUCT_PRINCIPLES.md and the "must build before first client / after 5 / after 25 / after 100" test), status starts at `Planning` until explicitly approved, and give it an honest Business Value / User Impact rating — not an aspirational one.*
