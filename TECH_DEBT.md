# Tech Debt

Every shortcut, gap, or deferred decision goes here the moment it's identified — not after it's forgotten. Reviewed alongside ROADMAP.md when planning each priority tier.

---

## No rate limiting on auth flows

**Reason:** Login, forgot-password, and resend-verification actions have no throttle. Only the interview-link submission path has a rate limiter today.
**Priority:** P1
**Estimated effort:** ~2 hours (extend the existing `src/features/interviews/server/rate-limit.ts` pattern to `src/actions/auth.ts`)

## `AuditLog` is effectively unused outside one feature

**Reason:** The model exists and is well-designed, but only the lead-intelligence feature ever writes to it. Payment verification, role assignment, and document deletion — all sensitive actions — currently leave no trail.
**Priority:** P1 (payment actions specifically) / P2 (broader coverage)
**Estimated effort:** ~1-2 hours per action site to wire in; ~8-10 hours total for full coverage across sales-crm, client-workspace, and auth role changes.

## `admin/reports` is a dead placeholder duplicating a real page

**Reason:** Built as a stub, never replaced — the actual working reports page lives at `admin/sales-crm/reports`.
**Priority:** P1
**Estimated effort:** 15 minutes (delete the page + nav entry).

## `admin/businesses` and `admin/leads` are the same component

**Reason:** `admin/businesses/page.tsx` is explicitly commented as "the same shared list page as Leads, forced to leadType BUSINESS" — two nav items for one feature.
**Priority:** P2
**Estimated effort:** ~2 hours to merge into one filterable/tabbed page and update nav.

## Interview candidate actions trust a bare `interviewId`, not a bound session token

**Reason:** Built for speed during the interview integrity feature — candidates never authenticate, so the actions rely on cuid unguessability rather than a cryptographically bound secret.
**Priority:** P2
**Estimated effort:** ~3-4 hours (issue a per-session token at `InterviewLink` creation, require it on every candidate-facing action).

## Upload validation is size-only, no MIME/extension check

**Reason:** `uploadFile`/`uploadImage` in `src/lib/cloudinary.ts` never validate content-type — callers only enforce file size caps. Not currently exploitable for RCE (Cloudinary hosts off-origin), but nothing stops an arbitrary file type being uploaded and distributed under the Stively domain's document links.
**Priority:** P2
**Estimated effort:** ~2 hours (add an allowlist check before upload across the 3 call sites: documents, attachments, interview recordings).

## Five near-identical activity/audit-log tables

**Reason:** `ActivityLog`, `SalesLeadActivity`, `BusinessActivity`, `InterviewActivityLog`, and `AuditLog` all share the same shape (`type` enum + `description` + `metadata Json?` + `performedBy`) reimplemented per-domain instead of one polymorphic timeline table. Each is individually well-justified in its own doc comments, but the pattern itself is duplicated five times.
**Priority:** P3
**Estimated effort:** ~12-16 hours for a full consolidation (schema migration + rewriting every read/write call site across 5 domains) — real churn for a cosmetic/maintainability win, not urgent.

## Dead notification enum values

**Reason:** `SESSION_REMINDER`, `ASSIGNMENT_DEADLINE`, and `CLIENT_ACCOUNT_INVITED` exist in the `NotificationType` enum but no code path ever fires them. `PROJECT_PAYMENT_DUE` also exists unused but is already scheduled to be wired up (see ROADMAP.md P2).
**Priority:** P3
**Estimated effort:** ~1-2 hours to decide per-type (implement `SESSION_REMINDER` if mentor live sessions justify it, delete the rest) + cleanup.

## Legacy `Enrollment`/`Program` models coexist with `OfferingEnrollment`/`Offering`

**Reason:** Schema's own comments flag these as parallel systems from different eras of the codebase. Not yet confirmed whether the legacy pair can be safely retired or is still load-bearing somewhere.
**Priority:** P2/P3 (investigation first, migration decision after)
**Estimated effort:** ~2-3 hours to fully trace remaining usage before any migration is scoped.

## `DiscoveryForm.salesProjectId` has no real Prisma relation

**Reason:** Added as a plain optional string FK (not a declared `@relation` to `SalesProject`) to avoid a second migration late in the qualified-client-system build. `resendDiscoveryForm` works around it with a manual `salesProject.findUnique` lookup instead of an `include`. Every other FK in this schema has a matching relation - this is the one exception.
**Priority:** P3
**Estimated effort:** ~15 minutes (add `salesProject SalesProject? @relation(...)` + the opposite `SalesProject.discoveryForms DiscoveryForm[]`, one migration, simplify `resendDiscoveryForm` back to a plain `include`).

## Lead qualification auto-links on email/phone match instead of asking

**Reason:** The brief asked for "detect the existing client and offer to link the lead rather than creating a duplicate" - `qualifyBusinessLeadTx` simplifies "offer" to "automatically link," since building a confirmation-dialog UI for a low-volume, pre-first-client flow wasn't worth the scope right now. Safe (an exact email/phone match is unambiguous), just not literally what was asked.
**Priority:** P2
**Estimated effort:** ~2-3 hours (return a "possible duplicate found" result instead of linking silently, add an admin confirm-or-create-new dialog).

## Public `/discovery/[token]` submission has no rate limiting

**Reason:** Unlike the public `/proposal/[token]` actions (which reuse a DB-backed fixed-window limiter), the discovery-form token submission has none - a one-time form fill is a much lower abuse surface than repeated comment/accept actions, so this was judged disproportionate to build now.
**Priority:** P3
**Estimated effort:** ~30 minutes (add the same `rateLimitWindowStart`/`rateLimitCount` fields + reuse `checkProposalRateLimit`'s pattern) if real abuse is ever observed.

## Public `/onboarding/[token]` submission has no rate limiting

**Reason:** Same judgment call as `/discovery/[token]` above - a one-time form fill is a low abuse surface, and this codebase's rate-limit pattern already exists to reuse if it's ever actually needed.
**Priority:** P3
**Estimated effort:** ~30 minutes.

## `OnboardingFormUpload` files have no lifecycle tracking

**Reason:** Unlike `ClientDocument` (archival/versioning, lifecycle status), an onboarding-form upload is just a Cloudinary URL with no expiry/archival concept - fine for one-time kickoff assets (logo, brand guidelines, etc.), but if these ever need to be superseded/re-uploaded with history kept, they don't currently support that.
**Priority:** P3
**Estimated effort:** ~1-2 hours if ever needed (add the same lifecycle fields `ClientDocument` already has).

## Near-duplicate priority enums

**Reason:** `RequestPriority` and `OperationPriority` are structurally identical (both LOW/MEDIUM/HIGH/URGENT) and could have been one shared enum.
**Priority:** P4
**Estimated effort:** ~1 hour.

---

*To add an item: one line of what it is, why it exists (usually "no time" or "smaller scope than the ideal solution"), and an honest priority + effort estimate — not an aspirational one.*
