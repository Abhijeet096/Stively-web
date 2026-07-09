# Stively — Phase A: Product & Technical Planning

**Status:** Planning (no app code shipped yet — this is the blueprint everything else gets built against)
**Owner:** CTO function
**Scope:** Phase 1 only (trust, audience, leads, training sales, blog, brand authority)

---

## 0. One flagged gap before we go further

Your tech stack has no payment gateway, but selling training programs is the Phase 1 revenue engine. This has to be decided before Phase B (Foundation), because it affects the DB schema, the checkout flow, and compliance.

**Recommendation: Razorpay, not Stripe.**

|                          | Razorpay                                                     | Stripe                                                        |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Business entity required | Works with individual/proprietorship to start, upgrade later | Requires a registered business entity in most cases for India |
| UPI support              | Native, first-class                                          | Not supported for Indian cards the way UPI is                 |
| INR settlement           | Direct, same-day/next-day options                            | More friction for India-based payouts                         |
| Docs/DX                  | Good, India-focused                                          | Excellent, but optimized for US/EU flows                      |

Since "Stively Technologies Private Limited" is a **future** legal name (not yet incorporated), Razorpay lets you start collecting payments as an individual/proprietorship and upgrade the account once incorporated, without re-architecting checkout. Stripe would likely block you here.

I've designed the `Enrollment` model to be gateway-agnostic (`paymentRef` is just a string), so this decision doesn't lock in the schema — but it does need to happen before Phase B's environment/config setup. Confirm or override and we lock it in.

---

## 1. Information Architecture

### 1.1 Site map (Phase 1)

```
/                           Home
/about                      About (mission, story, team, credibility)
/training                   Training hub (all programs, filterable)
/training/[slug]            Program detail (curriculum, price, outcomes, enroll CTA)
/pricing                    Pricing (plans/programs comparison, FAQs on payment)
/blog                       Blog hub (filter by category/tag)
/blog/[slug]                Blog post
/careers                    Careers (culture + "register interest" — static, see 1.3)
/faq                        FAQ (static content, see 1.3)
/contact                    Contact (form + business info)
/legal/privacy-policy       Legal
/legal/terms-of-service     Legal
/legal/refund-policy        Legal (mandatory once you're taking payments)

--- supporting infra (not top-nav pages, but required for paid training) ---
/login                      Auth
/signup                     Auth
/dashboard                  Enrolled student home (progress, enrolled programs)
/dashboard/programs         Enrolled program detail / materials access
```

**Why a dashboard exists in Phase 1 at all:** the moment you sell a paid program, the buyer needs somewhere to see what they bought. Keep it minimal — status + program access — resist the urge to build LMS features yet.

### 1.2 URL conventions

- All public URLs are lowercase, hyphenated, no trailing slash.
- `slug` fields are unique, human-readable, and set once (changing a live slug breaks SEO — if it must change, a redirect map is required later).
- No numeric IDs in public URLs, ever.

### 1.3 Content that should NOT live in the database (Phase 1)

Deliberate call, not an oversight: **FAQ content and Legal pages should be static** (MDX or a local `config/faq.ts` file), not DB-backed.

- **Why:** they change rarely, are read constantly, and gain nothing from a DB round-trip. Static content is fully build-time rendered — faster, better for SEO, zero DB load.
- **Trade-off:** founders can't edit FAQ copy without a code change/deploy. Acceptable in Phase 1 (low frequency of change). Revisit with a lightweight CMS in Phase 2 if non-engineers need to edit this weekly.

Careers follows the same logic: a static page with a "register interest" form (which writes to the `Lead` table, source = `CAREERS`) rather than a full job board with a `JobPosting` model. Building a job board before you have >1 open role is premature — add the model when you actually need it.

---

## 2. User Journeys

### 2.1 Prospective Student → Enrolled Student (primary revenue journey)

| Stage         | Touchpoint                 | Goal                             | Page                            | Key CTA               |
| ------------- | -------------------------- | -------------------------------- | ------------------------------- | --------------------- |
| Discovery     | Social / search / referral | "Is this legit?"                 | `/`                             | Scroll, not click yet |
| Evaluation    | Home → Training hub        | "Is there a program for me?"     | `/training`                     | Filter by level/mode  |
| Consideration | Program detail             | "What exactly do I get?"         | `/training/[slug]`              | "Enroll Now"          |
| Trust check   | Testimonials, About        | "Do real people vouch for this?" | `/about`, embedded testimonials | —                     |
| Conversion    | Signup → Payment           | Complete enrollment              | `/signup` → checkout            | Pay                   |
| Activation    | Dashboard                  | "I made the right call"          | `/dashboard`                    | Access first module   |

Design implication: the Program Detail page is the single highest-leverage page in the entire site. It needs outcomes stated in learner terms (not "you'll learn React" but "you'll ship a deployed full-stack app"), transparent pricing, and a visible testimonial from someone in a similar starting position.

### 2.2 Blog Reader → Lead (top-of-funnel journey)

| Stage           | Touchpoint              | Goal                           | Page                 | Key CTA      |
| --------------- | ----------------------- | ------------------------------ | -------------------- | ------------ |
| Arrival         | Google / social share   | Solve an immediate problem     | `/blog/[slug]`       | Read         |
| Trust build     | In-post content quality | "This company knows its stuff" | —                    | —            |
| Soft conversion | End-of-post / inline    | Stay in the loop               | Newsletter form      | Subscribe    |
| Hard conversion | Related program callout | "There's a program for this"   | Inline `ProgramCard` | View program |

Design implication: every blog post should end with **one** relevant program callout (not a generic "check out our training" — the specific program related to that post's topic), plus a newsletter capture. Don't stack multiple competing CTAs.

### 2.3 Enrolled Student (retention/dashboard journey)

| Stage         | Touchpoint | Goal                    | Page                  |
| ------------- | ---------- | ----------------------- | --------------------- |
| Post-purchase | Login      | Confirm access          | `/dashboard`          |
| Ongoing       | Dashboard  | Track enrolled programs | `/dashboard/programs` |

Kept intentionally thin for Phase 1 — this is not an LMS build. It exists to make the paid product feel real, not to deliver curriculum content interactively yet.

---

## 3. Design System

### 3.1 Color system

Inspiration brief (Linear, Stripe, Vercel) reads as: mostly neutral/near-monochrome, one confident accent color, color used sparingly and with intent — never decorative gradients.

**Recommendation:** Zinc-based neutral scale (cooler, more "engineered" than gray) + a single indigo-violet brand accent, distinct enough to be memorable but restrained enough to stay premium.

```css
/* globals.css — CSS variables, HSL format for shadcn/ui compatibility */
:root {
  /* Neutrals — Zinc scale */
  --background: 0 0% 100%;
  --foreground: 240 10% 4%;
  --muted: 240 5% 96%;
  --muted-foreground: 240 4% 46%;
  --border: 240 6% 90%;

  /* Brand — Stively Indigo */
  --primary: 243 75% 59%; /* #4F46E5-adjacent, but custom-tuned */
  --primary-foreground: 0 0% 100%;

  /* Semantic */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --destructive: 0 72% 51%;
  --info: 217 91% 60%;

  --radius: 0.75rem;
}

.dark {
  --background: 240 10% 4%;
  --foreground: 0 0% 98%;
  --muted: 240 4% 12%;
  --muted-foreground: 240 5% 65%;
  --border: 240 4% 18%;
  --primary: 243 75% 65%;
  --primary-foreground: 240 10% 4%;
}
```

Dark mode variables are defined now even though Phase 1 ships light-only — costs nothing to define, saves a rework later. Don't build a theme toggle UI yet.

**Rule:** the primary/accent color is reserved for CTAs, links, and active states only. Never for decorative backgrounds or large fills — that's how sites end up looking like generic AI-generated templates.

### 3.2 Typography

**Font: Geist Sans** (via `next/font/google` or the `geist` package) for everything, **Geist Mono** for code/technical snippets and stat callouts.

Why one family, not a display + body pairing: Linear/Stripe/Vercel all lean on a single, excellent sans-serif and use weight/size/spacing for hierarchy rather than mixing families. Mixing fonts is a common way "AI website" energy creeps in. Self-hosted via `next/font` means zero layout shift and no external font request — better Core Web Vitals, better SEO.

| Role           | Class                  | Weight | Tracking                                |
| -------------- | ---------------------- | ------ | --------------------------------------- |
| Hero / Display | `text-6xl md:text-7xl` | 700    | `tracking-tight`                        |
| H1             | `text-4xl md:text-5xl` | 600    | `tracking-tight`                        |
| H2             | `text-3xl md:text-4xl` | 600    | `tracking-tight`                        |
| H3             | `text-2xl md:text-3xl` | 600    | normal                                  |
| H4             | `text-xl md:text-2xl`  | 500    | normal                                  |
| Body Large     | `text-lg`              | 400    | normal                                  |
| Body           | `text-base`            | 400    | normal                                  |
| Body Small     | `text-sm`              | 400    | normal                                  |
| Caption        | `text-xs`              | 500    | `tracking-wide uppercase` (muted color) |

### 3.3 Layout system

- **Container:** `max-w-7xl mx-auto px-6 md:px-8 lg:px-12`
- **Breakpoints:** Tailwind defaults — `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`
- **Spacing base unit:** 4px (Tailwind default scale, unmodified — no reason to fight the framework here)
- **Section rhythm:** `py-20 md:py-28 lg:py-32` between major sections — generous, matches the "expensive" brief
- **Grid:** CSS Grid via Tailwind (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for card layouts; avoid float/flex hacks

### 3.4 Component library (Phase C build list)

**Primitives (shadcn/ui — installed, not hand-rolled):**
Button, Input, Textarea, Select, Checkbox, Radio Group, Switch, Label, Badge, Avatar, Separator, Tabs, Accordion, Dialog, Sheet, Dropdown Menu, Tooltip, Popover, Sonner (toasts), Skeleton, Card, Table, Form (react-hook-form + zod wrapper)

**Composed / domain components (hand-built on top of primitives):**

| Component              | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `Navbar` / `MobileNav` | Site navigation, sticky, transparent-to-solid on scroll        |
| `Footer`               | Sitemap links, legal links, social, newsletter mini-form       |
| `HeroSection`          | Home page hero, reusable pattern for sub-page heroes           |
| `ProgramCard`          | Training program summary (grid item)                           |
| `BlogPostCard`         | Blog post summary (grid item)                                  |
| `TestimonialCard`      | Social proof unit                                              |
| `PricingCard`          | Program/plan pricing display                                   |
| `StatCounter`          | Credibility stats (e.g., "500+ students")                      |
| `CTASection`           | Reusable conversion band, used sparingly per page              |
| `FAQAccordion`         | Wraps Accordion primitive, feeds from static FAQ data          |
| `LeadCaptureForm`      | Generic form → `Lead` server action, parameterized by `source` |
| `NewsletterForm`       | Compact email capture → `NewsletterSubscriber`                 |
| `ContactForm`          | Full contact form (name, email, message)                       |
| `EmptyState`           | Dashboard/no-data states                                       |
| `PageHeader`           | Consistent sub-page title/breadcrumb pattern                   |
| `SEOHead` / `JsonLd`   | Structured data injection per page type                        |

Every form-type component funnels into the **same** `Lead` model server action with a different `source` value — this is a deliberate DRY decision (see schema notes in §5).

---

## 4. Folder structure

```
stively/
├─ app/
│  ├─ (marketing)/
│  │  ├─ layout.tsx              # nav + footer wrapper
│  │  ├─ page.tsx                # Home
│  │  ├─ about/page.tsx
│  │  ├─ training/
│  │  │  ├─ page.tsx             # hub
│  │  │  └─ [slug]/page.tsx      # program detail
│  │  ├─ blog/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ pricing/page.tsx
│  │  ├─ faq/page.tsx
│  │  ├─ careers/page.tsx
│  │  ├─ contact/page.tsx
│  │  └─ legal/
│  │     ├─ privacy-policy/page.tsx
│  │     ├─ terms-of-service/page.tsx
│  │     └─ refund-policy/page.tsx
│  ├─ (auth)/
│  │  ├─ layout.tsx
│  │  ├─ login/page.tsx
│  │  └─ signup/page.tsx
│  ├─ (dashboard)/
│  │  ├─ layout.tsx              # auth-guarded
│  │  ├─ dashboard/page.tsx
│  │  └─ dashboard/programs/page.tsx
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  ├─ webhooks/payment/route.ts   # Razorpay webhook (or chosen gateway)
│  │  └─ og/route.tsx                # dynamic OG image generation
│  ├─ actions/
│  │  ├─ leads.ts
│  │  ├─ newsletter.ts
│  │  └─ enrollment.ts
│  ├─ sitemap.ts
│  ├─ robots.ts
│  ├─ layout.tsx                 # root layout (fonts, providers)
│  └─ globals.css
├─ components/
│  ├─ ui/                        # shadcn primitives (generated, don't hand-edit heavily)
│  ├─ shared/                    # Navbar, Footer, Logo, SEOHead
│  ├─ sections/                  # HeroSection, CTASection, etc.
│  └─ forms/                     # ContactForm, NewsletterForm, LeadCaptureForm
├─ lib/
│  ├─ prisma.ts                  # Prisma client singleton
│  ├─ auth.ts                    # Auth.js config
│  ├─ resend.ts                  # Resend client
│  ├─ cloudinary.ts              # Cloudinary config/helpers
│  ├─ utils.ts                   # cn(), formatters
│  └─ validations/                # zod schemas per form
├─ emails/                       # react-email templates for Resend
├─ prisma/
│  └─ schema.prisma
├─ config/
│  ├─ site.ts                    # nav links, site metadata constants
│  └─ faq.ts                     # static FAQ content
├─ types/
├─ hooks/
├─ public/
├─ .env.example
└─ next.config.ts
```

Route groups `(marketing)`, `(auth)`, `(dashboard)` share no layout — each gets its own nav/chrome, which matters because the dashboard shouldn't carry marketing nav clutter.

---

## 5. Database schema (Prisma)

Design decisions worth calling out before the code:

- **`Lead` is a single unified model** for contact form, program interest, careers interest, and newsletter-popup captures, differentiated by a `source` enum. This avoids four near-identical tables (`ContactSubmission`, `CareerInterest`, etc.) — one form component, one action, one table, filtered by `source` in whatever admin view comes later.
- **`NewsletterSubscriber` stays separate from `Lead`** because it's a different kind of relationship (ongoing subscription with unsubscribe state) rather than a one-time inquiry — merging these would force awkward nullable fields either direction.
- **`price` and `amountPaid` are integers in the smallest currency unit** (paise, not rupees) — never store money as a float. Standard practice, avoids rounding bugs at checkout.
- **`BlogPost.tags` uses a native Postgres string array**, not a join table. A full `Tag`/`Category` relational model is over-engineering for a blog that will have dozens, not thousands, of posts in Phase 1. Revisit if taxonomy complexity grows.
- **No `JobPosting` model** — Careers is static content + a `Lead` with `source: CAREERS`, per §1.3.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH.JS REQUIRED MODELS
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(STUDENT)

  accounts      Account[]
  sessions      Session[]
  enrollments   Enrollment[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  STUDENT
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// TRAINING PROGRAMS
// ============================================

model Program {
  id               String       @id @default(cuid())
  slug             String       @unique
  title            String
  shortDescription String
  description      String       @db.Text
  level            ProgramLevel @default(BEGINNER)
  mode             ProgramMode  @default(ONLINE)
  durationWeeks    Int
  price            Int          // smallest currency unit (paise)
  currency         String       @default("INR")
  startDate        DateTime?
  syllabus         Json         // structured module/topic list
  outcomes         String[]
  featuredImageUrl String?
  seoTitle         String?
  seoDescription   String?
  published        Boolean      @default(false)

  enrollments      Enrollment[]
  leads            Lead[]

  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
}

enum ProgramLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum ProgramMode {
  ONLINE
  OFFLINE
  HYBRID
}

model Enrollment {
  id         String           @id @default(cuid())
  userId     String
  programId  String
  status     EnrollmentStatus @default(PENDING)
  amountPaid Int
  paymentRef String?          // gateway-agnostic external reference
  enrolledAt DateTime         @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  program Program @relation(fields: [programId], references: [id], onDelete: Restrict)

  @@unique([userId, programId])
}

enum EnrollmentStatus {
  PENDING
  PAID
  COMPLETED
  CANCELLED
}

// ============================================
// LEAD CAPTURE (unified: contact, program interest, careers, newsletter popup)
// ============================================

model Lead {
  id        String     @id @default(cuid())
  name      String
  email     String
  phone     String?
  message   String?    @db.Text
  source    LeadSource
  status    LeadStatus @default(NEW)

  programId String?
  program   Program?   @relation(fields: [programId], references: [id], onDelete: SetNull)

  createdAt DateTime   @default(now())
}

enum LeadSource {
  CONTACT_FORM
  PROGRAM_INTEREST
  CAREERS
  NEWSLETTER_POPUP
  OTHER
}

enum LeadStatus {
  NEW
  CONTACTED
  CONVERTED
  CLOSED
}

// ============================================
// NEWSLETTER
// ============================================

model NewsletterSubscriber {
  id             String           @id @default(cuid())
  email          String           @unique
  status         SubscriberStatus @default(ACTIVE)
  source         String?
  subscribedAt   DateTime         @default(now())
  unsubscribedAt DateTime?
}

enum SubscriberStatus {
  ACTIVE
  UNSUBSCRIBED
}

// ============================================
// BLOG
// ============================================

model BlogPost {
  id              String    @id @default(cuid())
  slug            String    @unique
  title           String
  excerpt         String
  content         String    @db.Text  // MDX
  coverImageUrl   String?
  category        String
  tags            String[]
  authorName      String
  authorRole      String?
  authorAvatarUrl String?
  seoTitle        String?
  seoDescription  String?
  published       Boolean   @default(false)
  publishedAt     DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ============================================
// TESTIMONIALS
// ============================================

model Testimonial {
  id          String   @id @default(cuid())
  studentName String
  studentRole String?
  avatarUrl   String?
  quote       String   @db.Text
  rating      Int?
  programId   String?
  published   Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
}
```

---

## 6. API architecture

**Core decision: no internal REST/GraphQL API layer.** Reads happen directly in React Server Components via the Prisma client; writes happen through Server Actions. Route Handlers (`app/api/*`) are reserved strictly for things that _must_ be HTTP endpoints — Auth.js's own routing requirement and external webhooks.

**Why (tradeoff):** A hand-built REST API between your own frontend and your own database is pure overhead in the App Router model — extra serialization, extra network hop, extra auth-checking code, for zero benefit, since nothing external consumes this API in Phase 1. The moment a mobile app, partner integration, or public API product exists (later phase), that's the trigger to introduce a real API layer — not before.

**Server Actions (`app/actions/`):**

| Action                          | Purpose                                         | Writes to              |
| ------------------------------- | ----------------------------------------------- | ---------------------- |
| `submitLead(data, source)`      | Powers Contact, Program Interest, Careers forms | `Lead`                 |
| `subscribeNewsletter(email)`    | Newsletter capture                              | `NewsletterSubscriber` |
| `initiateEnrollment(programId)` | Starts checkout, creates `PENDING` enrollment   | `Enrollment`           |

**Route Handlers (`app/api/`):**

| Route                         | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `auth/[...nextauth]/route.ts` | Auth.js requirement, not optional                                                                                   |
| `webhooks/payment/route.ts`   | Gateway confirms payment → flips `Enrollment.status` to `PAID`, triggers Resend confirmation email                  |
| `og/route.tsx`                | Dynamic Open Graph image generation per blog post/program (`next/og`) — real SEO/conversion value for social shares |

**Data fetching pattern:** every marketing/blog/training page is a Server Component fetching via Prisma directly, statically generated where possible (`generateStaticParams` for `[slug]` routes) with revalidation on publish — not client-side fetching. This is both the performance-correct and SEO-correct choice for content-driven pages.

---

## 7. Cross-cutting concerns (brief, not skipped)

- **SEO:** `generateMetadata` per route, `sitemap.ts` + `robots.ts` at root, JSON-LD (Organization, Course for programs, Article for blog posts), dynamic OG images per §6.
- **Accessibility:** shadcn/ui primitives are Radix-based (accessible by default) — the discipline needed is on custom components: semantic HTML, focus states using the `--primary` ring, alt text enforced on every image field in the schema.
- **Performance:** static generation wherever content isn't user-specific (everything except `/dashboard`), `next/image` for all Cloudinary assets, self-hosted fonts (already covered in §3.2).
- **Analytics:** GA4 + Search Console + Clarity load via a single `<Analytics />` component in root layout, deferred/non-blocking.

---

## What's next

This is the complete Phase A deliverable. Before I start Phase B (project init, dependency install, Prisma/Auth/Cloudinary/Resend config), I need one decision from you:

**Confirm the payment gateway** (Razorpay recommended in §0) — everything else here doesn't block on it, but Phase B's `.env` setup and the `initiateEnrollment` action do.
