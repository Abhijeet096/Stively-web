# Stively — Phase C: Design System

**Status:** Design language only — no business pages built against it yet.
**Reference point:** Stripe, Vercel, Linear, Framer, Notion, Raycast, Clerk, Resend — studied for restraint and craft, not copied for layout.

The single idea underneath every decision below: **quiet confidence**. Premium products in this category earn trust by removing everything that isn't load-bearing — color used as signal not decoration, motion used as feedback not spectacle, whitespace doing the work that borders and gradients do on a generic template.

---

## 1. Color palette

Four roles, deliberately not more: **Primary** (brand/action), **Secondary** (supporting UI), **Accent** (highlight states), **Surface** (elevation), plus **Neutral** and **Semantic** (success/warning/error/info).

| Role                                 | Token                                                                   | Usage                                                       | Why this role exists                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary**                          | `--primary` (Stively Indigo)                                            | CTAs, links, active states, focus rings, brand marks        | The _only_ saturated color most users see. If more than one color competes for attention, none of them win — this is the single lesson every product on the inspiration list shares.                                                                                                                         |
| **Secondary**                        | `--secondary` (Zinc-100 / Zinc-800 dark)                                | Secondary buttons, less prominent UI blocks                 | Deliberately desaturated — it recedes so Primary doesn't have to compete with it.                                                                                                                                                                                                                            |
| **Accent**                           | `--accent` (Zinc-100 / Zinc-800 dark, same values as Secondary at rest) | Hover backgrounds, selected menu items, badge fills         | Same neutral value as Secondary at rest, but it's a _distinct semantic role_ — Accent always means "state changed" (hovered, selected), Secondary always means "static, lower-emphasis UI." Same color, different job — components should never conflate the two even though the token value overlaps today. |
| **Surface**                          | `--background`, `--card`, `--popover`                                   | Elevation levels: page background → card → popover/dropdown | Three tiers, not one flat white — this is what makes stacked UI (a card with a dropdown menu) read as _layered_ rather than a border-outlined mess.                                                                                                                                                          |
| **Neutral**                          | Zinc 50–950                                                             | Text, borders, muted backgrounds                            | Zinc over Gray/Slate because it reads cooler and more "engineered" — closer to Linear/Vercel than to a generic Bootstrap gray.                                                                                                                                                                               |
| **Success / Warning / Error / Info** | `--success`, `--warning`, `--destructive`, `--info`                     | Status only — never decorative                              | If a color like `--success` shows up somewhere that isn't communicating a state, that's a bug in the design, not a valid stylistic choice.                                                                                                                                                                   |

**Already implemented** in `globals.css` (Phase B) using OKLCH — kept here unchanged, this section documents _why_ each token exists rather than re-defining values.

---

## 2. Typography system

**Font families:** Geist Sans (UI, all weights), Geist Mono (code, stats, tabular data). One family for everything else — see Phase A rationale (mixing display + body fonts is a common tell of "AI website" energy; Stripe/Linear/Vercel all lean on one excellent sans and use weight/size for hierarchy).

> **Addendum (premium-agency redesign):** this rule is deliberately relaxed for exactly one role: `<h1>` and section `<h2>` headings now use **Bricolage Grotesque** (`--font-display`, `font-display` utility) instead of Geist Sans. Reasoning: the "one family everywhere" rule is right for a SaaS *product* UI, but this brief explicitly asked the site to feel like a distinctive premium agency, not a template — a same-family heading system was the generic default, not a choice made for this brief. Scope stays narrow on purpose: body copy, buttons, card titles, nav, and badges all stay on Geist Sans, unchanged. Geist Mono's role (eyebrows, technical/data accents) is unchanged.

| Level      | Size / Line-height       | Weight | Tracking          | Usage                                       |
| ---------- | ------------------------ | ------ | ----------------- | ------------------------------------------- |
| Display    | 72px / 1.05 (`text-7xl`) | 700    | -0.02em           | Rare — hero moments only, max once per page |
| H1         | 48px / 1.1 (`text-5xl`)  | 600    | -0.02em           | Page title                                  |
| H2         | 36px / 1.2 (`text-4xl`)  | 600    | -0.01em           | Major section heading                       |
| H3         | 28px / 1.3 (`text-3xl`)  | 600    | normal            | Subsection heading                          |
| H4         | 22px / 1.4 (`text-2xl`)  | 500    | normal            | Card titles, minor headings                 |
| Body Large | 18px / 1.6 (`text-lg`)   | 400    | normal            | Intro paragraphs, lead text                 |
| Body       | 16px / 1.6 (`text-base`) | 400    | normal            | Default paragraph text                      |
| Body Small | 14px / 1.5 (`text-sm`)   | 400    | normal            | Secondary text, metadata                    |
| Caption    | 12px / 1.4 (`text-xs`)   | 500    | 0.02em, uppercase | Labels, timestamps, eyebrow text            |

**Rules, not just sizes:**

- Numbers that represent data (prices, stats, counts) always get `font-variant-numeric: tabular-nums` — prevents digits from jittering in width as they update, a detail every product on the inspiration list gets right and most templates miss.
- Line length caps at `65ch` for body paragraphs (`max-w-prose` equivalent) — unconstrained line length is the single most common reason "professional" content reads as amateur.
- Headings use `text-balance` (native CSS, zero JS) so multi-line headings don't end with an orphaned single word.

---

## 3. Spacing system

Tailwind's default 4px-base scale, unmodified — see Phase A. What's new here is **semantic usage tiers**, so every component pulls from the same three bands instead of picking arbitrary values:

| Tier      | Values             | Usage                                                                                       |
| --------- | ------------------ | ------------------------------------------------------------------------------------------- |
| Micro     | `1–2` (4–8px)      | Icon-to-text gaps, tight inline spacing                                                     |
| Component | `3–6` (12–24px)    | Padding inside cards/buttons/inputs, gaps between related elements                          |
| Layout    | `8–16` (32–64px)   | Gaps between distinct components on a page                                                  |
| Section   | `20–32` (80–128px) | Vertical rhythm between page sections (already set as `py-20 md:py-28 lg:py-32` in Phase A) |

Rule: never hand-pick a value outside these tiers for a new component. If nothing in the scale fits, that's a signal the layout problem is being solved wrong, not a reason to add `pt-[17px]`.

---

## 4. Border radius system

| Token         | Value  | Usage                               |
| ------------- | ------ | ----------------------------------- |
| `--radius-sm` | 8px    | Badges (non-pill), small controls   |
| `--radius-md` | 10px   | Inputs, buttons (default)           |
| `--radius-lg` | 12px   | Cards, dialogs (base `--radius`)    |
| `--radius-xl` | 16px   | Large cards, modals, feature panels |
| `full`        | 9999px | Pills, avatars, dot indicators      |

Consistent radius pairing is what makes a nested layout (button inside a card) look intentional rather than accidental — the inner radius should always be ≤ the outer radius. A button inside a card never gets a larger radius than the card itself.

---

## 5. Shadow system

Generic Tailwind shadows (`shadow-md`, `shadow-lg`) read as dated — hard black shadows at default opacity is a dead giveaway of an unstyled template. The fix used by every product on the inspiration list: **larger blur radius, much lower opacity, near-zero spread.**

```css
@theme inline {
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 2px 8px -2px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
  --shadow-md: 0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04);
  --shadow-lg: 0 16px 48px -8px rgb(0 0 0 / 0.12), 0 4px 12px -4px rgb(0 0 0 / 0.06);
}
```

Usage: `shadow-xs` for inputs/subtle borders, `shadow-sm` for cards at rest, `shadow-md` for cards on hover / popovers, `shadow-lg` for modals only. Never jump straight to `shadow-lg` on a resting element — it's the equivalent of shouting.

---

## 6. Animation guidelines

| Speed    | Duration  | Easing                          | Usage                                      |
| -------- | --------- | ------------------------------- | ------------------------------------------ |
| Micro    | 100–150ms | `ease-out`                      | Hover states, button press, focus ring     |
| Standard | 200ms     | `cubic-bezier(0.16, 1, 0.3, 1)` | Dropdowns, tooltips, accordion expand      |
| Emphasis | 300–400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Modal/sheet entrance, page-section reveals |

That cubic-bezier (often called "ease-out-expo" in motion libraries) is what gives Linear/Vercel's interfaces their distinct "snap then settle" feel rather than a linear or generic ease — fast start, soft landing, no overshoot.

**Rules:**

- Exit animations are faster than entrance animations (roughly 2/3 the duration) — something leaving the screen shouldn't hold the user's attention as long as something arriving.
- `prefers-reduced-motion: reduce` collapses all durations to near-zero — already implemented globally in `globals.css` (Phase B).

---

## 7. Motion principles

1. **Motion communicates state, not decoration.** Every animation should answer "what changed?" (opened, loading, succeeded, moved) — if it doesn't answer that question, cut it.
2. **Hover states are subtle:** `opacity`, 1–2% `scale`, or 2–4px `translate` — never a bouncy scale-up or color-inverting hover. Restraint here is a major visual signal of "premium" vs "template."
3. **No animation on page load** beyond a simple fade for above-the-fold content. Products in this category don't animate every element in on scroll — that reads as a marketing template, not a product.
   > **Addendum (premium-agency redesign):** relaxed once, narrowly, for the homepage/marketing Hero only: a single orchestrated ~600–800ms `animejs` timeline (eyebrow → heading → "signal path" line draw → subheading → CTAs), justified by the signal-path motif the Hero introduces (the same line reappears literally as `BusinessProcess`'s scroll-linked timeline connector, and closes as a static echo near the footer — see `src/lib/animations.ts`). This is a single deliberate moment, not per-element stagger spam, and every other section keeps the plain scroll-triggered `Reveal` fade this rule describes. Reduced motion still collapses it to an instant, fully-visible final state.
4. **Loading and success states use motion functionally** (skeleton shimmer, a checkmark that draws in) — this is the one place more elaborate motion is earned, because it's communicating real state.

---

## 8. Grid system

12-column CSS Grid via Tailwind utilities (`grid-cols-12`, or simpler `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for card layouts) — unchanged from Phase A. Gutter: `gap-6` (24px) as default, `gap-4` for tighter card grids, `gap-8` for spacious feature layouts.

---

## 9. Breakpoints

Tailwind defaults, unmodified — `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`. No custom breakpoints added: the default scale already covers phone/tablet/laptop/desktop/wide-desktop without needing a bespoke set, and matching the framework default keeps every third-party component (and every future contributor's intuition) aligned.

---

## 10. Icon usage rules

**Library:** Lucide (already installed) — consistent 1.5px–2px stroke weight, matches the geometric, slightly rounded character of Geist.

- **Default stroke width:** `1.75` (Lucide's default is 2 — very slightly thinned for a more refined, less "outlined-icon-pack" feel, matching the restraint everywhere else in the system).
- **Sizing pairs with text size:** 16px icon next to `text-sm`, 20px next to `text-base`, 24px next to `text-lg`+. Never eyeball icon size against text — mismatched icon/text scale is one of the fastest ways a UI reads as unpolished.
- **Icon-only buttons require `aria-label`** — no exceptions (accessibility floor, see §25).
- **Icons never carry meaning alone** — always paired with a text label or a universally unambiguous symbol (X for close, chevron for expand). Don't invent iconography for concepts that need a word.

---

## 11. Card styles

Three variants, one component (`variant` prop):

| Variant       | Style                                                                   | Usage                                                       |
| ------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `default`     | `border` + `shadow-xs`, `bg-card`                                       | Static content containers (most common)                     |
| `elevated`    | No border, `shadow-sm`                                                  | Cards that need to visually separate from a busy background |
| `interactive` | `default` + hover → `shadow-md` + `border-primary/20`, `cursor-pointer` | Clickable cards (program cards, blog cards)                 |

Padding: `p-6` default, `p-4` for dense/compact contexts (dashboard widgets later). Radius: `--radius-lg` (12px).

---

## 12. Button variants

| Variant       | Style                         | Usage                                                                       |
| ------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `primary`     | Solid `bg-primary`            | The one primary action per view — never two primary buttons visible at once |
| `secondary`   | Solid `bg-secondary`          | Supporting actions alongside a primary button                               |
| `outline`     | Border, transparent fill      | Tertiary actions, "Cancel" alongside a primary/destructive pairing          |
| `ghost`       | No border/fill until hover    | Toolbar-style actions, icon buttons                                         |
| `destructive` | Solid `bg-destructive`        | Delete/cancel-enrollment style actions only                                 |
| `link`        | Text-only, underline on hover | Inline actions that should read as text, not a control                      |

**Sizes:** `sm` (32px height), `default` (40px height), `lg` (44px height), `icon` (square, matches height). **States:** hover (opacity 90%), active (opacity 80% + 1px scale-down), focus-visible (2px ring, brand color), disabled (50% opacity, no pointer events), loading (spinner replaces label, button keeps its width to avoid layout shift).

---

## 13. Form styles

- **Layout:** label above input always (never inline-left labels — they don't reflow well and hurt scan-ability), `gap-1.5` between label and input, `gap-6` between fields.
- **Help text:** below the input, `text-sm text-muted-foreground`.
- **Error text:** below the input, replaces help text (never shown together), `text-sm text-destructive`, paired with an error icon and `aria-invalid` + `aria-describedby` on the input for screen readers.
- **Required fields:** no asterisk clutter — mark optional fields instead with a muted "(optional)" suffix on the label. Most fields in a form are required; marking the minority is less visual noise.

---

## 14. Input styles

Default: `h-10`, `border`, `rounded-md`, `px-3`, `bg-background`. Focus: border becomes `--ring` color + 2px focus ring (not just a color change — a visible ring is an accessibility requirement, not a style preference). Error state: `border-destructive`, `focus:ring-destructive`. Disabled: `opacity-50`, `bg-muted`, no pointer events.

---

## 15. Badge styles

| Variant                               | Usage                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `default`                             | Neutral tag (e.g., a category label)                                      |
| `secondary`                           | Lower-emphasis tag                                                        |
| `success` / `warning` / `destructive` | Status only (enrollment status, lead status)                              |
| `outline`                             | Bordered, transparent — for dense UI where solid fills would be too heavy |

Always `rounded-full`, `text-xs font-medium`, `px-2.5 py-0.5` — pill-shaped and small is the detail that keeps badges from competing visually with buttons.

---

## 16. Navigation styles

- **Desktop:** sticky top bar, transparent over hero content, transitions to `bg-background/80 backdrop-blur-md border-b` once scrolled past ~24px (the frosted-glass-on-scroll pattern every product on the inspiration list uses — it keeps the hero clean without sacrificing nav accessibility once scrolling).
- **Active link:** underline or subtle `text-foreground` vs `text-muted-foreground` for inactive — never a heavy pill/background on the active nav item, which reads as dated.
- **Mobile:** hamburger → full-height slide-in sheet (not a dropdown — a dropdown over a mobile viewport competes with content).

---

## 17. Footer styles

Multi-column link groups (Product, Company, Resources, Legal), newsletter capture as a distinct top band, social icons + copyright as the final row. Kept visually quiet — `text-sm`, `text-muted-foreground` links, `border-t` separating it from page content. The footer should never try to look "designed" — it's a utility, and over-designing it undercuts the restraint established everywhere else.

---

## 18. Section layouts

Every section: `<Section>` wrapper (padding + optional background variant) containing a `<Container>` (max-width + horizontal padding, from Phase A). Background variants: `default` (page background), `muted` (subtle `bg-muted` band for visual separation between sections without a hard border), `inverted` (dark band, used sparingly — maximum once per page — for a CTA section that needs to visually anchor the page).

---

## 19. CTA styles

One CTA band pattern: centered heading + one-line supporting copy + single primary button. Per the Phase A journey design, at most one dedicated CTA section per page beyond the persistent nav/contextual buttons — stacking multiple competing CTA bands is a top reason marketing pages feel like they're shouting.

---

## 20. Empty states

Pattern: centered icon (in a soft circular `bg-muted` badge, not a bare icon floating in space) → heading → one-line description → optional single action button. Used for "no enrollments yet," "no results," dashboard states once those exist.

---

## 21. Loading states

**Rule:** skeletons for content that's _about to appear_ (page/section loading), spinners only for _actions in progress_ (button submit, form processing). A spinner replacing an entire page reads as unpolished; a skeleton matching the real layout reads as fast even when it isn't.

---

## 22. Skeleton loaders

`bg-muted` blocks with a subtle shimmer animation (`animate-pulse`, or a custom shimmer gradient sweep for a more refined feel than Tailwind's default pulse). Skeleton shapes must match the real content's shape (a card skeleton has the same image-block + two text-line proportions as the real card) — a generic gray rectangle doesn't read as "loading this specific thing."

---

## 23. Error pages

Already built in Phase B (`error.tsx`, `global-error.tsx`) — this section documents the design language they should be _restyled_ to once components exist: centered layout, `text-muted-foreground` supporting copy (never alarming red walls of text for a recoverable error), one clear recovery action button, an email fallback link for anything unrecoverable.

---

## 24. 404 page design language

Same restrained pattern as error pages, lighter in tone since it's not really "broken" — just a wrong turn. Small `404` eyebrow label, one-line heading, one action ("Back to home"). No cutesy illustration — matches the "premium, technical, professional" brand personality better than a cartoon mascot would.

---

## 25. Accessibility rules

- **Contrast:** all text/background pairs meet WCAG AA (4.5:1 body text, 3:1 large text/UI components) — verified against the token values, not assumed.
- **Focus:** every interactive element has a visible `:focus-visible` ring (already global in `globals.css`) — never `outline: none` without a replacement.
- **Semantic HTML first:** `<button>` for actions, `<a>` for navigation, real `<label>`/`<input>` pairing — ARIA roles are a fallback for when semantic HTML genuinely can't express the pattern, not a default.
- **Icon-only controls** always get `aria-label`.
- **Motion respects `prefers-reduced-motion`** (already implemented).
- **Forms announce errors** to assistive tech via `aria-invalid` + `aria-describedby`, not color alone.

---

## 26. Dark mode strategy

Variables for both modes are already fully defined (Phase B `globals.css`) — **not turned on in the UI yet**. Recommended rollout when it's time: `next-themes` package, class-based (`.dark` on `<html>`), with a blocking inline script in the root layout to read the stored preference before first paint (prevents the flash-of-wrong-theme that plagues most dark-mode implementations). Building components against CSS variables now (rather than hardcoded Tailwind color utilities) means enabling dark mode later is a config change, not a rewrite — every component built in this phase already respects both palettes automatically.

---

## 27. Component naming convention

- **shadcn/ui primitives:** kebab-case filename (`button.tsx`), PascalCase named export (`Button`), matching shadcn's own convention exactly — so the CLI (`npx shadcn add`) and hand-written components never collide in style.
- **Domain/composed components:** PascalCase, descriptively named for what they _are_, not where they're used (`ProgramCard`, not `TrainingPageCard`) — a component named after its content survives being reused somewhere unplanned; one named after its original page doesn't.
- **Props:** `variant` and `size` for any component with visual variants (matches the `class-variance-authority` pattern already in use for Button) — consistent prop naming means a developer's intuition from one component transfers to the next.

---

## 28. Folder structure for reusable UI components

Unchanged from Phase A/B, now populated:

```
src/components/
├─ ui/          shadcn primitives: button, card, input, label, badge, textarea, skeleton, separator, form
├─ shared/      Navbar, Footer, Container, Section, Logo
├─ sections/    CTASection, EmptyState (cross-page composed patterns)
└─ forms/       (form components arrive in Step 2+, once real forms have real fields)
```

---

## 29. Tailwind theme variables

Tailwind v4's CSS-first config means the theme _is_ `globals.css`'s `@theme inline` block — no separate `tailwind.config.ts` mapping to maintain in parallel. Phase B already maps color tokens; this phase adds shadow and radius tokens to that same block (see `globals.css` diff below).

---

## 30. CSS variable architecture

Three layers, one direction of dependency:

1. **Raw tokens** (`:root`, `.dark`) — the actual OKLCH values. Only place a color value is ever hardcoded.
2. **Theme mapping** (`@theme inline`) — maps raw tokens to Tailwind utility names (`--color-primary` → enables `bg-primary`, `text-primary`, etc.).
3. **Components** — consume _only_ Tailwind utility classes (`bg-primary`, `shadow-md`), never raw `var(--primary)` or a hex code directly.

This is what makes dark mode (§26) a non-event when it ships: every component already reads through layer 2, so flipping `.dark` on `<html>` re-points layer 1 and every component updates with zero component-level changes.
