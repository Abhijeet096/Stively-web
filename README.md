# stively-web

The Stively company website - Next.js App Router, single application, everything else as pages inside it (per the Phase A/B architecture decisions).

**This is the foundation only.** No product pages exist yet - see "What's here" below.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (config-ready, see note below)
- PostgreSQL + Prisma
- Auth.js v5 - Google OAuth + Resend magic-link email (no passwords)
- Cloudinary (image storage)
- Resend (transactional email)
- Razorpay (payments - integration-ready, not wired to a live checkout yet)
- ESLint + Prettier (with `prettier-plugin-tailwindcss` for class sorting)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values, see below
npx prisma generate
npx prisma db push           # creates tables from prisma/schema.prisma
npm run dev
```

Open http://localhost:3000 - you'll see a temporary foundation-check screen, not the real homepage. That's intentional (see below).

## Environment variables

Every variable the app reads is documented in `.env.example`, including where to get each key. Required to run at all:

- `DATABASE_URL` - Postgres connection string (Neon, Supabase, or Vercel Postgres all have free tiers)
- `AUTH_SECRET` - generate with `npx auth secret`

Everything else (Google OAuth, Resend, Cloudinary, Razorpay, analytics IDs) can stay blank during early development - each integration degrades gracefully rather than crashing the build, but will obviously not function until configured.

## shadcn/ui note

`components.json` is configured, but individual components (Button, Card, Input, etc.) aren't installed yet - that's Phase C (Design System), not Phase B (Foundation). Add them as needed with:

```bash
npx shadcn@latest add button card input
```

This runs normally on your machine - it only failed inside the sandboxed environment this project was scaffolded in, which blocks `ui.shadcn.com`.

## What's here (Phase B - Foundation)

- Full folder structure per the Phase A architecture doc
- Prisma schema (Auth.js models + Program, Enrollment, Lead, NewsletterSubscriber, Testimonial)
- Auth.js configured (Google + Resend providers, database sessions)
- Route protection for `/dashboard` (via `proxy.ts` - Next.js 16 renamed `middleware.ts`)
- Cloudinary, Resend, Razorpay clients configured and ready to call
- Unified lead-capture server action (`submitLead`) + newsletter action
- Metadata, Open Graph, Twitter cards, dynamic `sitemap.xml` and `robots.txt`
- Error boundary, global error boundary, not-found page, loading state
- Analytics component (GA4 + Microsoft Clarity, env-gated - silent until IDs are set)
- Full design token system in `globals.css` (Zinc neutrals + Stively Indigo, light/dark variables defined, dark mode not yet toggled in UI)

## What's deliberately NOT here yet

- No real pages (Home, About, Training, etc.) - that's Step 2 onward
- No shadcn/ui components installed - that's Phase C
- No live payment flow - Razorpay client exists, checkout UI doesn't
- No blog - lives in the separate `stively-blog` project, proxied under `stively.com/blog` later

## A note on this build

This project was scaffolded in a sandboxed environment without access to `ui.shadcn.com`, `binaries.prisma.sh`, or `fonts.googleapis.com`. Everything that depends on those (shadcn CLI, `prisma generate`, and the production build itself) was verified as far as possible without them - full TypeScript and ESLint checks pass. Run `npx prisma generate` and `npm run build` once on your machine with normal internet access to confirm the full build end-to-end; there's no reason to expect it not to, but that final check is worth doing yourself before you write pages against this foundation.
