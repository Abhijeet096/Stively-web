# Product Principles

The filter every new feature request passes through before any code gets written. When unsure whether to build something, check it against this list before checking anything else.

1. **Never duplicate functionality.** Before creating anything new, check whether it already exists under a different name. The Lead/SalesLead/OfferingRequest question gets asked about *something* almost every time a feature is proposed — ask it explicitly, don't assume the answer (see ARCHITECTURE_DECISIONS.md AD-001).

2. **One source of truth per concept.** If two models or two pages could plausibly represent the same real-world thing, that's a design smell — either they're genuinely different (document why) or they should be one thing.

3. **Automation over manual work.** Every repeated manual admin step is a candidate for the roadmap. Not every one gets built immediately — but every one gets *noticed*, not silently accepted as "just how it works."

4. **Workflow over isolated pages.** Data with a lifecycle — a status, an approval, a review — becomes a workflow with real state, not a static document or a lone page that has to be manually checked.

5. **Dashboard over PDFs when live data exists.** If the data already lives in the database and changes over time, show it live. Freezing it into a static document that goes stale the moment anything changes is strictly worse for everyone.

6. **Reuse existing models before creating new ones.** Extend before you invent. A new Prisma model is a permanent addition to the schema's surface area — treat it like one.

7. **Notify, don't rely on someone checking.** Every meaningful state change should tell the person who needs to know about it, not wait to be discovered by someone who happened to look. (This is the single biggest gap the 2026-08-03 audit found — see `project_platform_architecture_audit` memory.)

8. **Client trust is more important than adding features.** No fabricated stats, no invented testimonials, no overpromising — real data only. This isn't new: it's already the standing rule for every page on the marketing site (see AGENTS.md), extended here to the whole product.

9. **Security before convenience.** Rate limiting, audit trails, and auth checks are not polish to add later — they're part of the feature, not a follow-up.

10. **Every feature must save time for someone** — sales, admin, or the client. If it doesn't, that's a reason to question why it's being built, not a reason to build it "just in case."

11. **Every major architectural decision gets an ADR.** If it involved weighing real trade-offs, it goes in ARCHITECTURE_DECISIONS.md the same day it's decided — not from memory, six months later, when nobody can reconstruct the reasoning.

12. **Don't build for pain that hasn't shown up yet.** A support-ticket system, a full audit-log compliance trail, a formal e-signature integration — these are all real, eventually. They're not worth building speculatively before the volume or the request that actually justifies them arrives. (See SOP.md's Client Support section for a live example of this being applied, not just stated.)
