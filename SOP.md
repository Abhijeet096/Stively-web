# Standard Operating Procedures

ROADMAP.md answers "what are we building." This answers "how do we operate today." Each step below is marked:

- ✅ **Platform-enforced** — the software does this or makes it impossible to skip.
- ⚠️ **Platform-supported, process-enforced** — the tool exists, but following the step is still down to human discipline.
- 🔜 **Not built yet** — currently a fully manual/off-platform step. Roadmap reference given where one exists.

Keep this honest. An SOP that claims something is automated when it isn't just teaches people to trust a safety net that doesn't exist.

---

## Sales SOP — Lead to Project

1. **Lead arrives** (`/start-project`, `/contact`, or self-service `OfferingRequest`) ✅ — every source lands in `Lead` or `SalesLead`, and `notifyNewLeadCreated` fires to every `SALES`-role user immediately.
   - **Known gap:** `/start-project` deliberately doesn't collect email (trimmed for conversion — see ARCHITECTURE_DECISIONS.md history in `feedback_technical_gotchas` memory). That means the automatic client acknowledgement email never fires for those leads — the first human contact **is** the acknowledgement. Don't rely on "they got our email" for this source.
2. **Claim the lead** ✅ — first salesperson to claim it via `/sales/inbound` owns it (race-safe). Not admin-assigned; whoever's fastest gets it.
3. **Call within 15 minutes** ⚠️ — this is policy, not enforced. Nothing currently times how long a lead sits unclaimed or uncalled. If leads are going stale, this is the first thing to check before assuming the process is being followed.
4. **Update CRM** ✅ — notes/status live on `SalesLead`, visible to the whole sales team immediately.
5. **Schedule meeting** ✅ — `SalesLeadMeeting`, client sees it in their portal once they have an account.
6. **Send Company Profile** ⚠️ — no account exists yet at this stage, so this is a manual send (email/WhatsApp) today. See ARCHITECTURE_DECISIONS.md AD-002 — this document is Canva-static by design, so "manual send" isn't a gap to close, it's the intended mechanism, before there's a dashboard to put it in.
7. **Requirement Form** 🔜 — not built. Today, requirements are gathered verbally/manually. See ROADMAP.md P2.
8. **Proposal** ✅ — built, sent in-portal, client can accept/reject/comment.
9. **Quote** ✅ — `SalesQuote`, built.
10. **Agreement (NDA / Service Agreement)** 🔜 — not built. See ROADMAP.md P2. Until it ships, use the Canva NDA/Service Agreement templates manually if confidentiality needs to be established before this point.
11. **Invoice** 🔜 — in progress, see ROADMAP.md P1 and ARCHITECTURE_DECISIONS.md AD-002/AD-003/AD-004.
12. **Convert to Project** ⚠️ — a deliberate manual admin action (`convertLeadToProject`), by design — never automatic. Currently requires re-typing the total value by hand instead of pulling it from the accepted quote; that's a known gap, see ROADMAP.md P1.

## Development SOP — Project Created to Warranty

1. **Project created** ⚠️ — via the manual conversion step above.
2. **Assign team** ✅ — `salesPersonId`/`projectManagerId`/`assignedDeveloperId` on `SalesProject`.
3. **Kickoff** — not a distinct tracked event; represented by the first `ProjectMilestone` entry.
4. **Timeline** ✅ — `ProjectMilestone`, ordered, client-visible, admin-managed.
5. **Progress updates** ✅ — `ProjectUpdate` (completed items / planned next / blockers), client-visible. Not literally "daily" — posted whenever admin posts one. If a cadence matters, that's a process discipline, not something the software currently reminds anyone about.
6. **QA** 🔜 — not built as a real workflow yet. See ROADMAP.md P3.
7. **UAT** 🔜 — same, see ROADMAP.md P3.
8. **Deployment** ⚠️ — `SalesProject.status` can be updated, but nothing else happens automatically when it changes — no client notification, no warranty start.
9. **Warranty** ⚠️ — `warrantyExpiresAt` is a real field, shown to the client once set, but it's a fully manual date entry today, disconnected from project status. See ROADMAP.md P2 for auto-starting it on completion.

## Client Support SOP — Ticket to Feedback

1. **Ticket** 🔜 — no support-ticket system exists. Today, client issues come in through the existing chat/message feature (`SalesLeadMessage`) or outside the platform entirely (WhatsApp/email). If support volume grows enough that this becomes painful, that's the signal to build a real ticketing feature — don't build it speculatively before that pain shows up (see PRODUCT_PRINCIPLES.md).
2. **Assign / Priority / Resolve / Close** 🔜 — same, no dedicated workflow yet.
3. **Feedback** 🔜 — deferred (Feedback Form / Testimonial Request), not urgent per the earlier document-strategy discussion — no real testimonials exist yet to request feedback toward in the first place.

---

*When a 🔜 or ⚠️ item gets built, flip its marker to ✅ and link the relevant ARCHITECTURE_DECISIONS.md entry. When a step's actual behavior changes, update this file in the same change — an SOP describing software that no longer exists is worse than no SOP.*
