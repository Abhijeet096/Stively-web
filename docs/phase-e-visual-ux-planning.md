# Stively — Phase E: Visual UX Planning

**Status:** Wireframes and UX reasoning only — no code, no components, no pages built.
**Revision:** Home updated post-review to add a "Who We Help" section (Students / Businesses / Mentors) near the bottom of the page, per the ecosystem-positioning discussion — single-audience conversion focus for Phase 1 preserved, multi-audience signal added without competing with it. All other pages unchanged.
**Template note:** the brief's two lists overlapped (Purpose/Hierarchy/CTA/Layout vs. the numbered 1–10) — merged into one structure per page so each decision is explained once, not twice.
**Reading the wireframes:** ASCII box sketches show desktop structure and relative emphasis (box size ≈ visual weight), not pixel layout. Mobile is documented as reflow rules from the desktop sketch, since mobile rarely needs a structurally different page — just a different stacking order and priority.

Every page below draws its component vocabulary from Phase C (`Button`, `Card`, `Badge`, `Section`, `Container`, `EmptyState`, `Skeleton`, `FormField`, `Navbar`, `Footer`) and its section order from Phase D's journey/CTA/SEO decisions — this phase is where those become a literal page layout, not a new design language.

---

## Home

**User goal:** "Is this a real, credible place, and is there something here for me?" — evaluating trust in under 10 seconds.
**Business goal:** move a cold visitor to `/training` or a program page with intent, not just impressions — while, for the minority who scroll all the way down, signaling that Stively is a larger ecosystem than a single training site (added per the Phase E revision below).
**Psychology:** skeptical by default (anyone landing on an unknown edtech site has seen a hundred generic ones) — every section's job is incrementally reducing that skepticism, not adding excitement.

```
┌──────────────────────────────────────────────┐
│ NAVBAR (sticky, transparent→solid on scroll)   │
├──────────────────────────────────────────────┤
│  HERO                                          │
│  Eyebrow · H1 (outcome, not feature) · Subhead │
│  (subhead carries the ecosystem framing in one │
│  sentence — see note below)                    │
│  [Explore Programs]  [How it works ↓]          │
├──────────────────────────────────────────────┤
│  TRUST BAND (muted bg) — only if real numbers  │
├──────────────────────────────────────────────┤
│  PROGRAMS OVERVIEW — 3 ProgramCards + view-all │
├──────────────────────────────────────────────┤
│  HOW IT WORKS — 4-step horizontal process      │
├──────────────────────────────────────────────┤
│  TESTIMONIALS — carousel, 1 at a time (mobile) │
├──────────────────────────────────────────────┤
│  CTA BAND (inverted bg) — the one big ask      │
├──────────────────────────────────────────────┤
│  WHO WE HELP (NEW) — quiet 3-up: Students /    │
│  Businesses / Mentors, text-led, no icons-grid  │
├──────────────────────────────────────────────┤
│  FOOTER                                        │
└──────────────────────────────────────────────┘
```

**Hero subhead note:** carries the ecosystem framing in prose, not structure — e.g. "Stively trains developers, connects them with real projects, and helps companies hire the ones who are ready." Costs nothing structurally; every visitor reads it regardless of which audience they are, without splitting the hero into multiple entry points (see the Home evaluation discussion — a 3-way hero split was considered and rejected for Phase 1).

**Who We Help section (added per revision):** three short entries — Students, Businesses, Mentors — each one line of copy plus a text link (`/training`, `/services`, `/mentors`), not cards with sub-item lists. Deliberately placed *after* the CTA band, not before it and not in the hero, for two reasons: it never competes with "Explore Programs" for attention (the primary ask is already made and visually resolved by the time this section appears), and it rewards exactly the visitors worth rewarding — anyone scrolling this far is already invested, which is precisely the audience (a future mentor, a future hiring partner) who benefits most from seeing the bigger picture. Every link routes to a page that already exists (Phase A/E) — nothing this section promises is unbuilt.

**Why not sub-items (Learn/Build Projects/Internship, etc.):** most of those sub-destinations don't have real pages yet (Internship, Hire Developers, Join Our Network). Listing them would repeat the exact mistake flagged for `/services` in this same document — UI promising more than the product delivers. Three audiences, three real links, nothing more.

**Section order logic:** trust has to be earned before the pitch — Trust Band and Programs come before "How it works" convinces on mechanism, which comes before Testimonials convince on outcome, which is exactly when the CTA lands (maximum accumulated trust, right before the ask). Who We Help comes *after* the ask specifically so it reads as "here's more about us" epilogue content, not a competing offer presented alongside the main one — ordering is what keeps it subtle rather than diluting.

**Mobile reflow:** Hero CTA buttons stack full-width; Trust Band numbers go 2-column grid instead of a row; Programs Overview becomes a horizontal-scroll carousel (3-column grid doesn't fit, and vertical-stacking 3 full cards pushes "How it works" below the fold too far); Testimonials always single-card on mobile (already true on desktop-adjacent breakpoints); Who We Help stacks its three entries vertically, same treatment as any simple 3-up list elsewhere in the site.

**Components used:** `Navbar`, `Section` (default/muted/inverted), `Container`, `Button` (primary + ghost for hero), `Card variant="interactive"` (program cards), `Badge` (program level tags), `Footer`. Who We Help uses plain text + `Link` — deliberately not `Card`, to keep it visually quieter than every content section above it (see Animations below).

**Animations:** Hero content fades in once on load (200ms, no stagger-per-word gimmicks — see Phase C §7 rule against page-load animation spectacle). Program cards and testimonials get no scroll-triggered entrance animation; only hover states (Phase C micro, 150ms). Navbar background transition on scroll (200ms, already built in Phase C). Who We Help gets zero motion of any kind, not even a hover lift beyond a simple underline-on-hover for its links — the absence of motion here is itself the signal that this section is quieter than the sections above it.

**Empty states:** if `Program.published` count is 0 (shouldn't happen at launch, but defensively) — Programs Overview section is simply omitted from the page rather than showing an `EmptyState` in a marketing context; an empty state message on a homepage reads as broken, not "coming soon." Testimonials section follows the same rule — omit if empty, never show a placeholder. Who We Help has no dynamic data (all three links are static), so no empty-state question applies to it.

**Loading states:** Home is server-rendered/statically generated (Phase B pattern — Server Components fetch directly), so there's no client-side loading spinner for the visitor. The only loading consideration is build-time ISR revalidation when a new `Program` or `Testimonial` publishes — invisible to the user by design.

**SEO:** `Organization` JSON-LD in root layout (already Phase B/D). H1 carries the primary keyword intent ("training programs for students," not a slogan). Programs Overview links (not JS-only cards) so crawlers reach program pages from `/`. Who We Help's three links are real anchor tags, which has a small but real secondary benefit: it's additional internal linking equity toward `/services` and `/mentors`, pages that otherwise get little internal linking elsewhere in the sitemap.

**Accessibility:** single H1, sequential heading levels through sections (no skipped levels for stylistic sizing — a visually large H3 styled to look like an H2 still tags as H3). Testimonial carousel has visible prev/next controls (not swipe-only) and pauses autoplay on focus/hover. Hero CTA buttons meet the 44px minimum touch target. Who We Help's heading (e.g. "Who we help") is a real H2 despite its quiet visual styling — semantic structure follows content hierarchy, not visual weight, so screen reader users still get an accurate outline of the page even though this section is designed to look subordinate.

---

## About

**User goal:** "Who's actually behind this, and can I trust them?"
**Business goal:** convert lingering skepticism into confidence (primary), surface the Mentor path to the right audience (secondary, per Phase D §12).
**Psychology:** this is the page a cautious parent, a skeptical developer, or a considering-mentor professional reads closely — it needs substance, not marketing copy.

```
┌──────────────────────────────────────────────┐
│  HERO — mission statement, 1-2 sentences       │
├──────────────────────────────────────────────┤
│  STORY — why Stively exists (origin, problem)  │
├──────────────────────────────────────────────┤
│  VALUES — 3-4 principles, short + concrete      │
├──────────────────────────────────────────────┤
│  TEAM (if ready — see note below)              │
├──────────────────────────────────────────────┤
│  CTA BAND — [Explore Programs] / [Teach with us]│
├──────────────────────────────────────────────┤
│  FOOTER                                        │
└──────────────────────────────────────────────┘
```

**Section order logic:** Story before Values before Team — a reader needs the "why" before names/faces mean anything; leading with team photos before context is a common template mistake (faces without a story is just a stock-photo grid).

**Team section note:** ship this only when there are real people to show — a thin/placeholder team section undermines the exact trust this page exists to build. Omit entirely rather than fill with vague titles until it's real.

**Mobile reflow:** single column throughout (this page was never multi-column at a structural level — no reflow decisions needed beyond standard text-width constraints).

**Components used:** `Section`, `Container`, `Card` (values, optionally team), `Button` (dual CTA at bottom).

**Animations:** none beyond standard hover states — this is a reading-heavy page, and motion here would compete with comprehension rather than aid it.

**Empty states:** Team section, as above — omitted, not empty-stated, when there's nothing real to show.

**Loading states:** none — fully static content.

**SEO:** target "about Stively," brand-name queries, and secondary intent from people researching legitimacy before purchase (a real, non-trivial search pattern for anyone about to pay for training).

**Accessibility:** values/principles as a real list (`<ul>`-equivalent structure), not a decorative grid with no semantic grouping — screen reader users should hear "4 items" not four disconnected paragraphs.

---

## Services

**User goal:** "Does this company do more than training — could they build something for my business?"
**Business goal:** per Phase D §3.4, this page can't yet run a full B2B funnel — its job in Phase 1 is credibility-building content plus a low-friction capture point, not a sales page for a capability that doesn't have delivery infrastructure yet.
**Psychology:** a visitor here is evaluating capability signal, not ready to buy — treat this like a portfolio/capability statement, not a pricing pitch.

```
┌──────────────────────────────────────────────┐
│  HERO — "What we build" positioning statement  │
├──────────────────────────────────────────────┤
│  OFFERING AREAS — 3-4 cards, descriptive only  │
│  (client dev / AI automation / websites —      │
│   named per the kickoff doc's future streams,  │
│   framed as capability, not a bookable service)│
├──────────────────────────────────────────────┤
│  WHY STIVELY (differentiation — student talent  │
│  pipeline is the actual differentiator here)    │
├──────────────────────────────────────────────┤
│  CTA — [Talk to us] → routes into /contact       │
│  with source-tagged context (Phase D §3.4)       │
├──────────────────────────────────────────────┤
│  FOOTER                                          │
└──────────────────────────────────────────────┘
```

**Section order logic:** flat and short by design — this page should not compete for depth with `/training`, which is where the real Phase 1 substance lives. Over-building this page would misrepresent what Stively can deliver today.

**Mobile reflow:** offering cards stack single-column; otherwise unchanged.

**Components used:** `Section`, `Container`, `Card variant="default"` (offering areas, not `interactive` — these aren't clickable to sub-pages, since none exist yet), `Button`.

**Animations:** none beyond hover states.

**Empty states:** N/A (static content only).

**Loading states:** none.

**SEO:** deliberately modest target — this page won't rank for competitive B2B agency terms in Phase 1 and shouldn't try; its job is serving direct/referral traffic and reinforcing the Organization's credibility for people already evaluating Stively for training.

**Accessibility:** standard heading hierarchy, no special considerations beyond baseline.

---

## Training (hub)

**User goal:** "Which program, if any, is right for me?" — comparison-shopping mode.
**Business goal:** the highest-leverage page after Program Detail — get the right visitor to the right program page fast.
**Psychology:** decision paralysis is the enemy here — too many undifferentiated options reads as "we don't know who we're for."

```
┌──────────────────────────────────────────────┐
│  HERO — short, sets expectation (# of programs,│
│  who they're for)                              │
├──────────────────────────────────────────────┤
│  FILTER BAR — level (Beginner/Intermediate/    │
│  Advanced), mode (Online/Offline/Hybrid)        │
├──────────────────────────────────────────────┤
│  PROGRAM GRID — all published Programs,         │
│  ProgramCard per item                           │
├──────────────────────────────────────────────┤
│  HOW IT WORKS (shared pattern with Home, but    │
│  longer/more detailed version here)             │
├──────────────────────────────────────────────┤
│  FAQ TEASER — 3-4 program-specific questions,   │
│  [See all FAQs →]                                │
├──────────────────────────────────────────────┤
│  CTA BAND — [Talk to an advisor] (soft CTA,      │
│  not "Enroll Now" — this page's job is routing,  │
│  not closing; closing happens on Program Detail) │
├──────────────────────────────────────────────┤
│  FOOTER                                          │
└──────────────────────────────────────────────┘
```

**Section order logic:** Filter before Grid (obviously functional), but the more important call is the CTA band's tone — this page should not pressure a close, because its actual job is disambiguation. A hard "Enroll Now" CTA here competes with and undercuts the real conversion moment on Program Detail.

**Mobile reflow:** Filter bar collapses into a single "Filters" button opening a `Sheet` (Phase C component, already built for mobile nav — reused here) rather than staying inline, since two filter dimensions inline eat too much mobile width. Program Grid becomes single column.

**Components used:** `Section`, `Container`, `Card variant="interactive"`, `Badge` (level/mode tags on filter and cards), `Sheet` (mobile filters), `Button`, `FAQAccordion` (Phase C).

**Animations:** filter changes re-render the grid with a brief fade (150ms) rather than an abrupt swap — small but prevents the "did that work?" moment when a filter is applied.

**Empty states:** filtered-to-zero-results state uses `EmptyState` — "No programs match these filters" with a "Clear filters" action. This is the one page in the whole site where an `EmptyState` is a *likely*, expected state (not a defensive edge case), because filter combinations can legitimately return nothing.

**Loading states:** none needed if statically generated with all programs pre-rendered and filtering done client-side; if filtering becomes server-driven later (large catalog), a `Skeleton` grid replaces `Card`s during refetch.

**SEO:** this is the primary pillar page (Phase D §9) — target broad category intent. Filter state should not fragment into separate indexable URLs unless deliberately built as SEO landing pages later (e.g., `/training?level=beginner` should stay `noindex` or canonical back to `/training` to avoid thin-content duplicate pages).

**Accessibility:** filter controls are real form elements (checkboxes/radio group, not styled `div`s) so they're keyboard-operable and announce state changes; results count announced via `aria-live` region when filters change, so screen reader users know a filter action had an effect.

---

## Program Detail

**User goal:** "Is this specific program worth my money and time?" — the actual purchase-decision page.
**Business goal:** the single highest-conversion-value page in the product. Everything upstream (Home, Training, blog) exists to funnel here.
**Psychology:** this is the "money moment" build-up — objections need to be pre-empted in order (what will I learn → do I believe it → can I afford it → what if I have doubts), not left for the visitor to hunt for.

```
┌──────────────────────────────────────────────┐
│  HERO — title, one-line outcome, level/mode     │
│  badges, price, [Enroll Now] (also sticky on    │
│  scroll — see below)                            │
├──────────────────────────────────────────────┤
│  OUTCOMES — "what you'll be able to do" list,   │
│  learner-outcome language, not topic list       │
├──────────────────────────────────────────────┤
│  CURRICULUM — accordion by module (from         │
│  Program.syllabus JSON), collapsed by default   │
├──────────────────────────────────────────────┤
│  MENTOR/INSTRUCTOR — who's actually teaching     │
│  this (ties to Phase D Mentor journey — a        │
│  concrete cross-reference, not decorative)       │
├──────────────────────────────────────────────┤
│  TESTIMONIALS — filtered to this Program only    │
│  (Testimonial.programId, Phase A schema)         │
├──────────────────────────────────────────────┤
│  PRICING RECAP + what's included                │
├──────────────────────────────────────────────┤
│  FAQ — program-specific, accordion               │
├──────────────────────────────────────────────┤
│  CTA BAND — final [Enroll Now]                   │
├──────────────────────────────────────────────┤
│  FOOTER                                          │
└──────────────────────────────────────────────┘
```

**Section order logic:** this order is the objection sequence — Outcomes answers "what do I get," Curriculum answers "how, specifically," Mentor answers "from whom" (credibility), Testimonials answers "did it work for someone like me," Pricing/FAQ mop up remaining hesitation, and only then the final ask. Putting Pricing near the top (a common template instinct) forces a price judgment before value is established — worse conversion, not just worse narrative.

**Sticky CTA bar:** once the Hero's primary "Enroll Now" scrolls out of view, a slim sticky bar (program name + price + Enroll button) appears at the top. This is the one piece of persistent, non-nav UI on the whole site — justified because this is the one page where losing the CTA off-screen for a long scroll (curriculum accordions get long) directly costs conversions.

**Mobile reflow:** Hero badges wrap to a second line; sticky CTA bar becomes bottom-anchored (thumb-reachable) instead of top-anchored, standard mobile commerce pattern; Curriculum accordion stays identical (accordions are already mobile-native).

**Components used:** `Section`, `Container`, `Badge` (level/mode/price context), `Button` (primary, both hero and sticky bar), accordion primitive (new — not yet built in Phase C, needed for Curriculum/FAQ; flagged for the component backlog), `Card` (mentor bio, testimonials).

**Animations:** Curriculum accordion expand/collapse at Phase C's "standard" duration (200ms, ease-out-expo). Sticky CTA bar slides in (200ms) rather than appearing abruptly. Testimonials here are a static grid, not a carousel (unlike Home) — a single program has few enough testimonials that a grid reads better than motion for motion's sake.

**Empty states:** if a program has zero testimonials yet (likely at launch, per Phase D §3.1's advocacy-stage dependency), the Testimonials section is omitted entirely — same rule as Home, an empty section reads as unfinished, not "early."

**Loading states:** statically generated per Phase B's `generateStaticParams` pattern — no client loading state for the page itself. Enroll button shows its `Button loading` state (Phase C, already built) during the Razorpay checkout handoff.

**SEO:** `Course` JSON-LD (price, duration, provider — per Phase D §9), title tag pattern `[Program Title] | Stively`, meta description pulling from `Program.shortDescription`. This is a cluster-target page for high-intent long-tail queries ("react developer training program india," etc.) — the Outcomes section's learner-language wording matters here as much as for conversion, since it's the language real searchers use.

**Accessibility:** accordion triggers are real buttons with `aria-expanded`; sticky CTA bar doesn't trap focus or overlap interactive content when a screen magnifier is in use (tested at 200% zoom); price is never conveyed by color alone if a "discounted" state ever exists (strikethrough + text, not just a color change).

---

## Pricing

**User goal:** "What does this actually cost, and what am I paying for?"
**Business goal:** remove price-related hesitation without training the visitor to think of Stively as a discount option — pricing pages that over-explain read as defensive.
**Psychology:** visitors here are already fairly warm (they clicked "Pricing," a high-intent nav item) — this page should confirm, not persuade from zero.

```
┌──────────────────────────────────────────────┐
│  HERO — short framing, not a sales pitch        │
├──────────────────────────────────────────────┤
│  PROGRAM PRICING — cards or table, one row/card  │
│  per published Program, price + what's included  │
├──────────────────────────────────────────────┤
│  WHAT'S INCLUDED (shared across programs) —      │
│  mentor access, materials, certificate, etc.      │
├──────────────────────────────────────────────┤
│  PAYMENT & REFUND — brief, links to full          │
│  /legal/refund-policy rather than duplicating it   │
├──────────────────────────────────────────────┤
│  FAQ — payment-specific (EMI? refunds? etc.)       │
├──────────────────────────────────────────────┤
│  CTA BAND — [Enroll Now] → routes to the           │
│  specific program if only one is live, else to     │
│  /training                                          │
├──────────────────────────────────────────────┤
│  FOOTER                                              │
└──────────────────────────────────────────────┘
```

**Section order logic:** "What's included" directly after prices, before any policy/FAQ content — a visitor who just saw a number needs immediate value justification, not procedural information about refunds.

**Mobile reflow:** pricing cards stack vertically in priority order (not alphabetical/creation-date order) — whichever program is the intended flagship offering leads.

**Components used:** `Section`, `Container`, `Card` (pricing cards), `Button`, `FAQAccordion`.

**Animations:** none beyond standard hover on cards — a pricing page is a place for clarity, not delight.

**Empty states:** N/A structurally (if zero programs are published, this page shouldn't be reachable — a build-time/routing concern, not a UI empty state).

**Loading states:** static generation, none needed.

**SEO:** target "[program/category] pricing" and "[program] cost" queries — genuinely valuable search intent for a training product, worth its own meta description distinct from Program Detail pages.

**Accessibility:** if pricing is presented as a table, use a real `<table>` structure (not a div grid styled to look like one) so screen readers get row/column relationships correctly.

---

## Careers

**User goal:** "Would I want to work here, and is there an actual opening?"
**Business goal:** per Phase D §1.3, static culture content + a `Lead` capture — no job-board infrastructure until there's real hiring volume.
**Psychology:** candidates evaluate culture signal here more than specific role details, since (per the architecture decision) there may be no live openings at all — the page has to earn interest even with an empty roles list.

```
┌──────────────────────────────────────────────┐
│  HERO — why work at Stively, one line           │
├──────────────────────────────────────────────┤
│  CULTURE/VALUES (can reuse About's Values        │
│  content, reframed for a candidate audience)      │
├──────────────────────────────────────────────┤
│  OPEN ROLES — list if any exist, EmptyState if    │
│  none ("No open roles right now — register your   │
│  interest and we'll reach out when something       │
│  fits")                                             │
├──────────────────────────────────────────────┤
│  REGISTER INTEREST FORM — name, email, area of      │
│  interest, message (→ Lead, source=CAREERS)          │
├──────────────────────────────────────────────┤
│  FOOTER                                               │
└──────────────────────────────────────────────┘
```

**Section order logic:** the `EmptyState` for Open Roles is placed *before* the form, not after — a candidate should see "nothing open right now" and immediately have the interest form as the next logical action, rather than scrolling past a form first and discovering afterward there's nothing to apply to.

**Mobile reflow:** single column throughout, form fields full-width.

**Components used:** `Section`, `Container`, `Card` (culture values), `EmptyState` (open roles), `FormField`, `Input`, `Textarea`, `Button`.

**Animations:** none beyond standard form-field focus states.

**Empty states:** the primary content of this page's middle section, not an edge case — see above.

**Loading states:** form submission uses `Button loading` state (Phase C) while the `submitLead` server action runs (Phase B, already built).

**SEO:** target "careers at Stively," "jobs at Stively" — low volume but real intent, worth the minimal metadata cost.

**Accessibility:** form errors follow Phase C's `FormField` pattern exactly (already built, ARIA-wired) — no new pattern needed here.

---

## Mentors

**User goal:** "What does mentoring here actually involve, and is it worth my time?"
**Business goal:** per Phase D §3.3, recruit industry professionals into the training delivery pipeline — this directly serves the core Phase 1 product, unlike Careers or Services.
**Psychology:** this audience is time-scarce professionals evaluating a volunteer-or-paid commitment — they need concrete expectations (time, format, compensation) fast, not inspirational copy.

```
┌──────────────────────────────────────────────┐
│  HERO — what mentoring at Stively means,        │
│  one line, sets expectation immediately          │
├──────────────────────────────────────────────┤
│  WHAT YOU'LL DO — concrete: format (live/async), │
│  time commitment, cohort size                     │
├──────────────────────────────────────────────┤
│  WHY MENTOR HERE — compensation model,             │
│  visibility, giving-back framing (in that order    │
│  of concreteness — money before mission, for an     │
│  audience this pragmatic)                            │
├──────────────────────────────────────────────┤
│  APPLICATION FORM — name, email, expertise area,     │
│  experience, availability (→ Lead, new source         │
│  value flagged in Phase D §3.5)                        │
├──────────────────────────────────────────────┤
│  FOOTER                                                 │
└──────────────────────────────────────────────┘
```

**Section order logic:** "Why mentor here" deliberately leads with compensation/visibility before mission language — reversing the usual nonprofit-style "purpose first" ordering, because this audience (working professionals with limited spare time) makes a practical time-value judgment first and an emotional one second; leading with mission for this specific audience reads as underselling the practical value.

**Mobile reflow:** single column, form full-width — structurally identical to Careers.

**Components used:** `Section`, `Container`, `Card` ("What you'll do" concrete facts, presented as a short stat-style list rather than paragraphs), `FormField`, `Input`, `Textarea`, `Select` (expertise area — new primitive, flagged for backlog, not yet built in Phase C), `Button`.

**Animations:** none beyond standard form interactions.

**Empty states:** N/A — no dynamic list content on this page.

**Loading states:** form submission `Button loading`, same pattern as Careers.

**SEO:** modest target — "become a mentor," "teach [skill] online" adjacent queries; secondary priority page, doesn't need pillar-level SEO investment.

**Accessibility:** `Select` component (once built) needs full keyboard operability and correct `aria-label`/associated `<label>` — flagged explicitly since select/dropdown components are a common accessibility failure point if not built on a proper primitive (Radix, matching Phase C's existing pattern for other inputs).

---

## Contact

**User goal:** "I have a question that isn't answered elsewhere — how do I reach a real person?"
**Business goal:** catch-all for every lead type not otherwise served by a dedicated form (including Company/Client inquiries, per Phase D §3.4) — this page needs to work as a funnel for several different intents at once without a confusing multi-purpose form.
**Psychology:** contact-page visitors are often slightly frustrated (they didn't find their answer elsewhere) or are a high-intent edge case (a company inquiry) — response speed expectation is high; the page should signal "we'll actually reply," not just collect the form and go silent.

```
┌──────────────────────────────────────────────┐
│  HERO — short heading, sets reply-time            │
│  expectation ("We usually reply within a day")     │
├──────────────────────────────────────────────┤
│  CONTACT FORM — name, email, message (single,       │
│  no topic dropdown — see note below)                 │
├──────────────────────────────────────────────┤
│  DIRECT CONTACT — email address, social links         │
│  (for people who'd rather not use a form)              │
├──────────────────────────────────────────────┤
│  "Looking for something specific?" — links to           │
│  FAQ, Training, and a one-line company-inquiry           │
│  mention (Phase D §3.4's capture point, lives            │
│  here as copy, not a separate form field)                 │
├──────────────────────────────────────────────┤
│  FOOTER                                                    │
└──────────────────────────────────────────────┘
```

**Why no topic dropdown:** a "reason for contact" dropdown feels like triage-for-the-company's-convenience, not help-for-the-visitor — and per Phase D, everything routes into the same `Lead` model regardless (`source: CONTACT_FORM` covers all of it). A free-text message field does the same disambiguation work invisibly, without adding a decision the visitor doesn't want to make.

**Mobile reflow:** single column, form full-width, direct-contact info moves below the form (desktop can afford a side-by-side split if the form is short; mobile can't).

**Components used:** `Section`, `Container`, `FormField`, `Input`, `Textarea`, `Button`.

**Animations:** none.

**Empty states:** N/A.

**Loading states:** `Button loading` during `submitLead`; a success state replaces the form with a confirmation message (not just a toast — the form disappearing and confirming is a stronger, harder-to-miss signal than a toast that a frustrated or high-intent visitor might not notice).

**SEO:** low priority for organic — this page serves direct/already-decided traffic, not search discovery. Metadata still complete for consistency, not for ranking effort.

**Accessibility:** success-state message must be announced via `aria-live="polite"` so screen reader users get positive confirmation the submission worked, since the form fields disappearing without an announcement would otherwise read as the page silently breaking.

---

## FAQ

**User goal:** "Answer my specific remaining question without making me contact someone."
**Business goal:** deflect support-email volume and remove late-funnel hesitation (also serves `FAQPage` structured data for SEO, per Phase D §9).
**Psychology:** users here are scanning, not reading — information density and findability matter more than narrative flow.

```
┌──────────────────────────────────────────────┐
│  HERO — short heading + search/filter input      │
├──────────────────────────────────────────────┤
│  CATEGORY TABS — General / Programs / Payments /  │
│  Account                                            │
├──────────────────────────────────────────────┤
│  QUESTION LIST — accordion per question, one        │
│  open at a time within a category                     │
├──────────────────────────────────────────────┤
│  CTA — "Still have questions?" → [Contact us]         │
├──────────────────────────────────────────────┤
│  FOOTER                                                │
└──────────────────────────────────────────────┘
```

**Section order logic:** Category tabs before the list is a scan-efficiency decision — an ungrouped flat list of 20+ questions is the single most common way FAQ pages fail their own purpose.

**Mobile reflow:** Category tabs become a horizontal scroll strip (not a dropdown — tabs stay visible and switchable in one tap, a dropdown adds a step for a page whose whole value is speed).

**Components used:** `Section`, `Container`, `Input` (search), `FAQAccordion` (Phase C, already built), `Button`.

**Animations:** accordion expand/collapse at Phase C's standard duration; search filtering re-renders the list with the same brief fade used on Training's filters.

**Empty states:** search-with-zero-results uses `EmptyState` — "No results for '[query]'" with a "Contact us" action, turning a dead-end search into a routed lead rather than a bounce.

**Loading states:** static content, client-side search/filter — no loading state needed.

**SEO:** `FAQPage` JSON-LD (Phase D §9) — this is one of the highest structured-data-ROI pages on the site, since FAQ rich results directly increase SERP real estate.

**Accessibility:** accordion triggers are real buttons with `aria-expanded`/`aria-controls`; category tabs use proper `role="tablist"`/`role="tab"` semantics so keyboard and screen reader users can navigate categories without relying on visual scanning.

---

## Dashboard Overview

**User goal:** "I just paid — did it work, and what do I do now?" (first visit) / "What's my status?" (return visits).
**Business goal:** confirm the purchase decision was correct (reduce buyer's remorse / support-ticket volume) and orient toward the next action (starting the program).
**Psychology:** distinct from every page above — this is a post-purchase, authenticated context. The anxiety here is "did this actually work," not "should I trust this company." Confirmation and clarity matter more than persuasion.

```
┌──────────┬────────────────────────────────────┐
│ SIDEBAR   │  Welcome back, [name]                │
│           │  ┌──────────────────────────────┐    │
│ Stively   │  │ [Program Card] status: PAID/    │    │
│           │  │ enrolled — or EmptyState if      │    │
│ Overview  │  │ zero enrollments                  │    │
│ Programs  │  └──────────────────────────────┘    │
│ Settings  │                                       │
│           │  Quick actions (View program, Browse   │
│ [Logout]  │  more programs)                         │
└──────────┴────────────────────────────────────┘
```

**Section order logic:** deliberately minimal — per Phase D §6, this is intentionally under-built relative to what a mature LMS dashboard would have (no activity feed, no progress charts yet), because the underlying data model (`Program.syllabus` as JSON, no per-lesson completion tracking) doesn't support more than this yet. Building a richer-looking dashboard than the data model can honestly support would be the same mistake as over-building `/services` — UI promising more than the product delivers.

**Mobile reflow:** sidebar collapses to the same `Sheet`-based pattern as the marketing nav (Phase C precedent reused, not a new pattern) — icon-only bottom bar was considered and rejected, since a dashboard this simple doesn't have enough destinations to justify permanent bottom-nav real estate on every screen.

**Components used:** `Card`, `EmptyState` (zero enrollments — links to `/training`), `Button`, `Badge` (enrollment status: PENDING/PAID/COMPLETED/CANCELLED, using the exact `EnrollmentStatus` enum values from the Phase A schema — status badges should read directly off real states, never an invented UI-only label).

**Animations:** none — a post-purchase confirmation screen should feel immediate and stable, not animated.

**Empty states:** the realistic first-visit state for many users (paid, but the enrollment record hasn't caught up, or genuinely zero enrollments if someone reaches `/dashboard` without ever purchasing) — `EmptyState` here explicitly reassures rather than looking broken: "No enrollments yet — your programs will show up here once you enroll," not a bare "No data."

**Loading states:** this is the one page in the whole site where a `Skeleton` (matching the eventual Program Card shape) is the correct choice over a spinner, per Phase C §21 — the user just paid and is anxious for confirmation; a shape-matching skeleton communicates "your thing is loading" far better than a generic spinner would in this specific, high-anxiety moment.

**SEO:** none — `noindex`, disallowed in `robots.ts` (already true per Phase B).

**Accessibility:** enrollment status conveyed by both `Badge` color and text label (never color alone — same rule as Program Detail's pricing); sidebar navigation is a real `<nav>` with current-page indicated via `aria-current`, matching the pattern already established in the Phase C `Navbar`.

---

## Cross-page patterns worth naming once

A few decisions repeat across multiple pages above — stated once here instead of re-explained on every page:

- **Empty sections are omitted, not empty-stated, on marketing pages** (Home, Program Detail) — an `EmptyState` component is for authenticated/functional contexts (Dashboard, filtered search results) where "nothing here yet" is honest information. On a marketing page, an empty section reads as broken, not transparent.
- **Every lead-capturing form uses the same `FormField` + `Button loading` pattern** (Careers, Mentors, Contact, footer newsletter) — no page invents its own form styling, which is the actual payoff of having built `FormField` as a reusable primitive in Phase C rather than styling each form ad hoc.
- **Two new primitives are flagged, not built:** an accordion (Curriculum, FAQ) and a `Select` (Mentor application). Both follow Phase C's existing pattern (Radix-backed, CVA-styled, ARIA-correct) — noted here as a backlog item for whenever component-building resumes, not designed in detail now since this phase is explicitly UX planning, not component work.
