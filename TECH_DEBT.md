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

## `Certificate` model is fully unused

**Reason:** Zero reads or writes anywhere in `src/` — exists per its own doc comment as a prepared extension point for a future certificate-generation phase that hasn't started.
**Priority:** P4
**Estimated effort:** Either ~30 minutes to remove, or a real feature-sized effort to implement — decision deferred until the training/LMS side scales enough to need it.

## Near-duplicate priority enums

**Reason:** `RequestPriority` and `OperationPriority` are structurally identical (both LOW/MEDIUM/HIGH/URGENT) and could have been one shared enum.
**Priority:** P4
**Estimated effort:** ~1 hour.

---

*To add an item: one line of what it is, why it exists (usually "no time" or "smaller scope than the ideal solution"), and an honest priority + effort estimate — not an aspirational one.*
