import Link from "next/link";
import Image from "next/image";
import {
  Check,
  X,
  Award,
  Sparkles,
  Layers,
  PlayCircle,
  BookOpen,
  ClipboardCheck,
  Unlock,
  ShieldCheck,
  Infinity as InfinityIcon,
  ChevronRight,
} from "lucide-react";
import type { Offering } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { HeroFeatheredImage } from "@/components/shared/hero-feathered-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { getCourseCertificateConfig } from "@/features/certificates/lib/course-config";
import { DIFFICULTY_LABEL, MODE_LABEL } from "../lib/labels";
import { getPrimaryOfferingCtaAction } from "../lib/purchase-cta";
import { getOfferingPricing } from "../lib/pricing";
import { parseOfferingFaqs } from "../lib/faq";
import { parseOfferingCurriculumTopics } from "../lib/curriculum-topics";
import type { CurriculumOutline } from "../server/queries";
import { GuestCheckoutForm } from "@/features/orders/components/guest-checkout-form";
import { SaleCountdown } from "./sale-countdown";

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** True of any TRAINING offering on this platform (see the LessonBlock/Assessment/Certificate models), so it isn't per-course copy that could go stale. */
const INCLUDED = [
  { icon: PlayCircle, label: "Recorded video lessons" },
  { icon: BookOpen, label: "Written reading material" },
  { icon: ClipboardCheck, label: "Quizzes on every lesson" },
  { icon: Award, label: "Certificate of completion" },
  { icon: InfinityIcon, label: "Lifetime access" },
  { icon: Sparkles, label: "All future updates" },
] as const;

const HOW_LEARNING_WORKS = [
  { icon: PlayCircle, title: "Watch", description: "A short, focused video lesson." },
  { icon: BookOpen, title: "Read", description: "Written notes covering the same ground." },
  { icon: Sparkles, title: "Practice", description: "Try it on a real AI assistant yourself." },
  { icon: ClipboardCheck, title: "Quiz", description: "Six questions to check you actually got it." },
  { icon: Unlock, title: "Unlock", description: "Pass, and the next lesson opens." },
] as const;

const COMPARISON = [
  { typical: "Hours of video you watch passively", stively: "Short lessons, then you actually try it" },
  { typical: "No way to know if you understood", stively: "A quiz gates every lesson before the next unlocks" },
  { typical: "Prompt lists that go stale", stively: "The reasoning behind prompts, so it transfers to any tool" },
  { typical: "Certificate for finishing the video", stively: "Certificate that reflects passed assessments" },
] as const;

const DEFAULT_COURSE_FAQS = [
  {
    question: "Do I need any prior experience?",
    answer:
      "No. The course starts from what Generative AI actually is and builds up from there. If you've used ChatGPT even once, you're ready.",
  },
  {
    question: "What do I need to follow along?",
    answer:
      "A laptop or phone with a browser, and access to any AI assistant - ChatGPT, Claude, Gemini or similar. A free account on any one of them is enough.",
  },
  {
    question: "Is this tied to one specific AI tool?",
    answer:
      "No. The techniques are deliberately tool-agnostic - they work the same across ChatGPT, Claude, Gemini and whatever replaces them next.",
  },
  {
    question: "How long do I have access?",
    answer:
      "Lifetime access, including every lesson and update added later. There's no subscription and nothing expires.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Yes - a certificate of completion once you finish the course and pass its assessments.",
  },
  {
    question: "How is the course delivered?",
    answer:
      "Entirely online and self-paced, inside your Stively dashboard. Each lesson has a video, written notes and a quiz you need to pass to unlock the next one.",
  },
  {
    question: "How do I pay, and is it secure?",
    answer:
      "Checkout is handled by Razorpay - UPI, cards, net banking and wallets. Stively never sees or stores your card details.",
  },
];

/**
 * The course-optimized detail page for TRAINING offerings - a single,
 * decision-focused product page rather than the generic catalog layout
 * every other category uses. Built mobile-first: the audience for these
 * courses is overwhelmingly on a phone, so price and action are visible
 * before the first scroll and again in a persistent bottom bar, while
 * desktop gets a sticky purchase card that follows the whole page.
 *
 * Every claim on this page is either structurally true of the platform
 * (quizzes gate lessons, certificates exist, lifetime access) or read off
 * the offering's own record. No invented testimonials, ratings, learner
 * counts or outcome statistics - conversion pressure here comes from real
 * mechanisms instead: a genuine, server-enforced launch-price deadline
 * (Offering.saleEndsAt via getOfferingPricing/SaleCountdown - the price
 * actually changes when it expires, both on this page and at checkout, not
 * just the copy) and an honest framing of being an early cohort, not
 * fabricated reviews. See the "founding price" section below.
 */
function CourseDetailView({
  offering,
  curriculum,
  nonce,
}: {
  offering: Offering;
  curriculum: CurriculumOutline | null;
  nonce?: string;
}) {
  const cta = getPrimaryOfferingCtaAction(offering);
  const { payable, anchor, percentOff, saleEndsAt } = getOfferingPricing(offering);
  const hasAnchorPrice = anchor != null;
  const heroImage = offering.bannerUrl ?? offering.thumbnailUrl;
  const faqs = parseOfferingFaqs(offering.faqs);
  const certificateConfig = getCourseCertificateConfig(offering.slug);
  const courseFaqs = faqs.length > 0 ? faqs : DEFAULT_COURSE_FAQS;

  const trustPoints = [
    offering.difficulty ? DIFFICULTY_LABEL[offering.difficulty] + " friendly" : null,
    "Certificate included",
    "Lifetime access",
    MODE_LABEL[offering.mode],
  ].filter((point): point is string => point !== null);

  const priceRow = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-4xl font-semibold tabular-nums">
          {payable != null ? formatPrice(payable, offering.currency) : "-"}
        </span>
        {hasAnchorPrice && (
          <>
            <span className="text-ink-muted-foreground text-xl line-through tabular-nums">
              {formatPrice(anchor!, offering.currency)}
            </span>
            {percentOff != null && <Badge variant="success">{percentOff}% OFF</Badge>}
          </>
        )}
      </div>
      {saleEndsAt && (
        <SaleCountdown
          endsAt={saleEndsAt.toISOString()}
          className="text-warning bg-warning/10 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        />
      )}
    </div>
  );

  const curriculumTopics = parseOfferingCurriculumTopics(offering.curriculum);

  const valueStrip = [
    // The full plan (moduleCount), not just what's recorded - matches how
    // the curriculum section below now presents it: the whole syllabus,
    // with each module either showing its real lesson or its real planned
    // topics. No separate "X lessons" count here, deliberately - that
    // paired with "8 modules" is exactly the mismatch that used to read as
    // broken/incomplete.
    curriculum ? { icon: Layers, label: `${curriculum.moduleCount} modules`, sub: "Structured path" } : null,
    { icon: PlayCircle, label: "Video + reading + quiz", sub: "Every lesson" },
    { icon: ClipboardCheck, label: "Quizzes", sub: "Gate every lesson" },
    { icon: Award, label: "Certificate", sub: "On completion" },
    { icon: InfinityIcon, label: "Lifetime access", sub: "Plus future updates" },
  ].filter((item): item is { icon: typeof Layers; label: string; sub: string } => item !== null);

  /** The purchase block, rendered twice: once sticky in the desktop sidebar, once inline for mobile. */
  const purchaseCard = (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-foreground font-display text-3xl font-semibold tabular-nums">
              {payable != null ? formatPrice(payable, offering.currency) : "-"}
            </span>
            {hasAnchorPrice && (
              <>
                <span className="text-muted-foreground text-base line-through tabular-nums">
                  {formatPrice(anchor!, offering.currency)}
                </span>
                {percentOff != null && <Badge variant="success">{percentOff}% OFF</Badge>}
              </>
            )}
          </div>
          {saleEndsAt && (
            <SaleCountdown
              endsAt={saleEndsAt.toISOString()}
              className="text-warning bg-warning/10 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            />
          )}
        </div>

        {offering.allowsGuestCheckout && payable != null ? (
          <GuestCheckoutForm
            offering={{
              id: offering.id,
              title: offering.title,
              price: payable,
              currency: offering.currency,
              promptsPackPrice: offering.promptsPackPrice,
              promptsPack500Price: offering.promptsPack500Price,
            }}
            nonce={nonce}
            // Both resolve to the real, purchasable Digital Store eBooks -
            // see PROMPTS_PACK_PRODUCT_SLUG / PROMPTS_PACK_500_PRODUCT_SLUG
            // in digital-download.ts, the single source of truth every
            // surface (this checkout add-on, the standalone listing) reads
            // from, so the copy here can never drift from what's delivered.
            promptsPackCopy={{
              label: "100 Practical AI Prompts",
              description: "PDF download, delivered by email",
            }}
            promptsPack500Copy={{
              label: "500 AI Prompt Templates",
              description: "PDF download, delivered by email",
            }}
          />
        ) : (
          cta && (
            <Button size="lg" asChild className="w-full">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )
        )}

        {offering.allowsGuestCheckout && (offering.promptsPackPrice != null || offering.promptsPack500Price != null) && (
          <Link href="/digital-store" className="text-primary text-center text-xs font-medium hover:underline">
            Just want a prompt pack? Buy one on its own in the Digital Store →
          </Link>
        )}

        <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Secure payment powered by Razorpay
        </p>

        <ul className="flex flex-col gap-2.5 border-t border-border/70 pt-4">
          {INCLUDED.map(({ icon: Icon, label }) => (
            <li key={label} className="text-foreground flex items-start gap-2.5 text-sm">
              <Icon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <Section background="inverted" className="relative overflow-hidden py-8 md:py-14 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 900px 520px at 10% 0%, oklch(0.541 0.216 265.75 / 0.30), transparent 62%)," +
              "radial-gradient(ellipse 720px 540px at 95% 45%, oklch(0.746 0.127 200.01 / 0.16), transparent 58%)",
          }}
        />
        <Container className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
          <div className="flex flex-col gap-5 lg:w-[55%]">
            <nav aria-label="Breadcrumb">
              <ol className="text-ink-muted-foreground flex items-center gap-1.5 text-sm">
                <li>
                  <Link href="/training" className="hover:text-ink-foreground transition-colors">
                    Training
                  </Link>
                </li>
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <li aria-current="page" className="text-ink-foreground/80 line-clamp-1">
                  {offering.title}
                </li>
              </ol>
            </nav>

            <div className="flex flex-wrap gap-2">
              {offering.featured && <Badge variant="gradient">Bestseller</Badge>}
              {offering.difficulty && <Badge variant="ink">{DIFFICULTY_LABEL[offering.difficulty]}</Badge>}
              <Badge variant="ink">{MODE_LABEL[offering.mode]}</Badge>
              {offering.duration && <Badge variant="ink">{offering.duration}</Badge>}
            </div>

            <h1
              className="font-display font-semibold tracking-[-0.03em] text-balance"
              style={{ fontSize: "clamp(1.875rem, 4vw, 3.25rem)", lineHeight: 1.07 }}
            >
              {offering.title}
            </h1>
            <p className="text-ink-muted-foreground max-w-xl text-base text-pretty sm:text-lg">
              {offering.shortDescription}
            </p>

            {priceRow}

            {cta && (
              <div className="flex flex-col gap-2">
                <Button size="lg" variant="inverse" asChild className="w-full sm:w-fit sm:px-10">
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
                <p className="text-ink-muted-foreground flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Secure payment powered by Razorpay
                </p>
              </div>
            )}

            <ul className="text-ink-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Check className="text-brand-teal size-4" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Bleeds slightly past the content column on large screens so the artwork reads as part of the section, not an inset panel. */}
          <div className="lg:-mr-6 lg:w-[48%] xl:-mr-12">
            {heroImage ? (
              <HeroFeatheredImage
                src={heroImage}
                alt={`${offering.title} course preview`}
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="aspect-[16/10]"
              />
            ) : (
              // Only the placeholder keeps a frame - there's no artwork to blend into the section.
              <div className="border-ink-border-strong text-ink-muted-foreground flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl border bg-white/[0.04]">
                <PlayCircle className="size-10" aria-hidden="true" />
                <span className="text-sm">Course preview coming soon</span>
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* ── VALUE STRIP ──────────────────────────────────── */}
      <Section background="default" className="border-border/70 border-b py-8 md:py-10">
        <Container>
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {valueStrip.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground text-sm font-semibold">{label}</span>
                  <span className="text-muted-foreground text-xs">{sub}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── MAIN: content + sticky purchase card ─────────── */}
      {/*
        Single purchaseCard render, not two. The previous version rendered
        the full card - including GuestCheckoutForm, its Razorpay <Script>,
        and a Radix Dialog - once in a `hidden lg:block` aside and again in
        an `lg:hidden` div for mobile. Tailwind's `hidden`/`lg:hidden` only
        sets `display:none` - React still mounts, hydrates, and runs effects
        for BOTH copies regardless of which one is visible, roughly doubling
        this page's hydration cost for no visible benefit (confirmed via a
        PageSpeed Insights audit flagging 429 KiB unused JS and 1,770ms
        Total Blocking Time on this exact page). One real DOM node now,
        repositioned per breakpoint via explicit CSS Grid placement instead
        of a second mount: `lg:col-start-2` puts it in the sidebar column on
        desktop (unchanged visual result), while its DOM position - first,
        not last - is also what fixes the second bug this surfaced: `#enroll`
        used to sit on the *outer* Section wrapping the entire content column
        too, so every "Enroll now" CTA scrolled to the top of the whole
        content stack, not the form - a mobile visitor still had to scroll
        past every section below to reach the actual purchaseCard duplicate
        that used to live at the bottom. `#enroll` now lives directly on this
        card, and its DOM-first position means mobile sees it immediately
        after the value strip, no scrolling required either way.
      */}
      <Section background="default" className="py-12 md:py-16 lg:py-20">
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <aside id="enroll" className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
            {purchaseCard}
          </aside>

          <div className="flex flex-col gap-14 lg:col-start-1 lg:row-start-1">
            {/* THE PROBLEM */}
            <div className="flex flex-col gap-5">
              <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                You already use AI. But are you using it well?
              </h2>
              <p className="text-muted-foreground text-pretty">
                Most people get vague, generic output and assume that&apos;s just how AI works. Usually
                it isn&apos;t the tool - it&apos;s the instruction.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Answers that are vague and generic",
                  "Prompts that leave too much to guesswork",
                  "Missing context, so the AI fills gaps itself",
                  "Confident answers that are quietly wrong",
                  "Nothing repeatable - starting from scratch every time",
                  "No way to tell good output from bad",
                ].map((problem) => (
                  <li key={problem} className="text-muted-foreground flex items-start gap-2.5 text-sm">
                    <X className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span className="text-pretty">{problem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WHAT YOU'LL LEARN */}
            {offering.whatYoullLearn.length > 0 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  What you&apos;ll learn
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offering.whatYoullLearn.map((item) => (
                    <Card key={item} className="h-full">
                      <CardContent className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Check className="size-4" aria-hidden="true" />
                        </span>
                        <span className="text-foreground text-sm text-pretty">{item}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* CURRICULUM - real Module/Lesson rows, full 8-module plan.
              Every module in the real plan is shown, in order - not just
              what's recorded. A module with a built lesson shows the real
              video/reading-notes/quiz structure (see
              prisma/seed-genai-course.ts, the platform's actual LessonBlock
              shape, not invented for this page). A module not recorded yet
              shows its real planned topics (Offering.curriculum's own
              admin-authored syllabus - same source the seed data itself
              comes from) instead of a lesson breakdown - real content,
              still honestly not claiming a lesson/video exists yet, but
              without a "Coming soon" tag singling it out from the rest of
              the syllabus. That distinction (recorded vs. planned) lives on
              the student dashboard's actual video player instead, where it
              matters - a paying, enrolled student sees a real "video coming
              soon" state per lesson (BlockVideo), not this page. */}
            {curriculum && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Course curriculum
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {curriculum.moduleCount} modules, structured start to finish. Every lesson: a recorded
                    video, reading notes, and a graded quiz
                    {curriculum.averageLessonMinutes != null && ` - about ${curriculum.averageLessonMinutes} min average`}.
                  </p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {curriculum.modules.map((module, index) => {
                    const topics = curriculumTopics.get(module.title) ?? [];
                    return (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger>
                          <span className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1 pr-3 text-left">
                            <span className="flex items-center gap-2.5">
                              <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums">
                                {index + 1}
                              </span>
                              {module.title}
                            </span>
                            {module.lessonCount > 0 && (
                              <span className="text-muted-foreground text-xs font-normal">
                                {module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}
                                {module.totalMinutes != null && ` · ${formatMinutes(module.totalMinutes)}`}
                              </span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          {module.lessonCount > 0 ? (
                            <ul className="flex flex-col gap-3">
                              {module.lessons.map((lesson) => {
                                const showLessonTitle = lesson.title !== module.title;
                                return (
                                  <li key={lesson.id} className="border-border/70 rounded-lg border">
                                    <div className="flex items-center gap-3 px-3.5 py-3">
                                      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                                        <PlayCircle className="size-4" aria-hidden="true" />
                                      </span>
                                      <span className="flex flex-1 flex-col">
                                        <span className="text-foreground text-sm font-semibold">
                                          {showLessonTitle ? lesson.title : "Video lesson"}
                                        </span>
                                        <span className="text-muted-foreground text-xs">Recorded lecture</span>
                                      </span>
                                      {lesson.estimatedMinutes != null && (
                                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                          {formatMinutes(lesson.estimatedMinutes)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="border-border/70 flex items-center gap-3 border-t px-3.5 py-2.5">
                                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                                        <BookOpen className="size-4" aria-hidden="true" />
                                      </span>
                                      <span className="text-foreground text-sm font-medium">Reading notes</span>
                                    </div>
                                    <div className="border-border/70 flex items-center gap-3 border-t px-3.5 py-2.5">
                                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                                        <ClipboardCheck className="size-4" aria-hidden="true" />
                                      </span>
                                      <span className="text-foreground text-sm font-medium">
                                        Quiz{" "}
                                        <span className="text-muted-foreground font-normal">
                                          - 3 of 6 to unlock the next lesson
                                        </span>
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : topics.length > 0 ? (
                            <ul className="grid gap-2 sm:grid-cols-2">
                              {topics.map((topic) => (
                                <li key={topic} className="text-muted-foreground flex items-start gap-2 text-sm">
                                  <Check className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                  <span className="text-pretty">{topic}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground text-sm">Full lesson breakdown added soon.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}

            {/* HOW LEARNING WORKS */}
            <div className="flex flex-col gap-5">
              <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                How learning works
              </h2>
              <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {HOW_LEARNING_WORKS.map(({ icon: Icon, title, description }, index) => (
                  <li key={title}>
                    <Card className="h-full">
                      <CardContent className="flex flex-col gap-2">
                        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="text-foreground text-sm font-semibold">
                          {index + 1}. {title}
                        </span>
                        <span className="text-muted-foreground text-xs text-pretty">{description}</span>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
              <p className="text-muted-foreground text-sm">
                You need at least 3 of 6 correct to pass a quiz. Get it wrong and you can retry - the
                point is that you actually understood it, not that you got one shot.
              </p>
            </div>

            {/* WHY THIS COURSE */}
            <div className="flex flex-col gap-5">
              <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Why this course
              </h2>
              <div className="border-border/70 overflow-hidden rounded-xl border">
                <div className="bg-muted grid grid-cols-2 gap-4 px-4 py-3 text-sm font-semibold">
                  <span className="text-muted-foreground">A typical AI course</span>
                  <span className="text-foreground">The Stively approach</span>
                </div>
                <ul className="divide-border/70 divide-y">
                  {COMPARISON.map((row) => (
                    <li key={row.stively} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                      <span className="text-muted-foreground flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden="true" />
                        <span className="text-pretty">{row.typical}</span>
                      </span>
                      <span className="text-foreground flex items-start gap-2">
                        <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span className="text-pretty">{row.stively}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* WHO IT'S FOR */}
            {offering.whoItsFor.length > 0 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Who this is for
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offering.whoItsFor.map((item) => (
                    <Card key={item}>
                      <CardContent className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Check className="size-4" aria-hidden="true" />
                        </span>
                        <span className="text-foreground text-sm text-pretty">{item}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {offering.requirements.length > 0 && (
                  <p className="text-muted-foreground text-sm">
                    <span className="text-foreground font-medium">What you need: </span>
                    {offering.requirements.join(" · ")}
                  </p>
                )}
              </div>
            )}

            {/* WHAT'S INCLUDED */}
            <div className="flex flex-col gap-5">
              <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                What&apos;s included
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {INCLUDED.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="border-border/70 text-foreground flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                  >
                    <Icon className="text-primary size-4 shrink-0" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── ABOUT STIVELY ────────────────────────────────── */}
      <Section background="muted" className="py-12 md:py-16">
        <Container className="flex flex-col gap-4">
          <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            About Stively
          </h2>
          <p className="text-muted-foreground max-w-3xl text-pretty">
            {siteConfig.description}
          </p>
          <p className="text-muted-foreground max-w-3xl text-pretty">
            This course is built and maintained by the same team that builds software for our
            clients - the material reflects how these tools are actually used on real work, not a
            theoretical syllabus.
          </p>
        </Container>
      </Section>

      {/* ── FOUNDING PRICE (in place of fabricated testimonials) ──
        Still no invented reviews/ratings/learner counts - that's a hard
        line (see BRAND_PRINCIPLES.md: "no fabricated proof"), and the
        previous framing here ("we're not going to show you reviews that
        don't exist yet") tested the honesty but read as an apology instead
        of a reason to act. This reframes the same true fact (new course,
        no reviews yet) as the upside it actually is - early pricing before
        it goes up - backed by a real, server-enforced deadline instead of
        invented social proof. */}
      {saleEndsAt ? (
        <Section background="default" className="py-12 md:py-16">
          <Container className="flex flex-col items-center gap-4 text-center">
            <Badge variant="gradient">Founding price</Badge>
            <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              You&apos;re early - that&apos;s the advantage
            </h2>
            <p className="text-muted-foreground max-w-2xl text-pretty">
              This course just launched, so we&apos;re not padding this page with reviews that
              don&apos;t exist yet. What&apos;s real instead:{" "}
              {anchor != null && payable != null && (
                <>
                  the price goes from{" "}
                  <span className="text-foreground font-semibold">
                    {formatPrice(payable, offering.currency)}
                  </span>{" "}
                  to{" "}
                  <span className="text-foreground font-semibold">
                    {formatPrice(anchor, offering.currency)}
                  </span>{" "}
                  once the founding-price window closes, and it won&apos;t come back down.
                </>
              )}{" "}
              Lifetime access and every future update are covered either way - joining now just
              means paying less for the same thing.
            </p>
            <SaleCountdown
              endsAt={saleEndsAt.toISOString()}
              className="text-warning bg-warning/10 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            />
          </Container>
        </Section>
      ) : (
        <Section background="default" className="py-12 md:py-16">
          <Container className="flex flex-col items-center gap-4 text-center">
            <Badge variant="secondary">New course</Badge>
            <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Be one of our first learners
            </h2>
            <p className="text-muted-foreground max-w-2xl text-pretty">
              This course has just launched, so we&apos;re not going to show you reviews that
              don&apos;t exist yet. Take it, tell us what worked and what didn&apos;t, and your
              feedback will shape what we add next.
            </p>
          </Container>
        </Section>
      )}

      {/* ── CERTIFICATE PREVIEW - only for courses that actually issue one (src/features/certificates/lib/course-config.ts), so no course shows a preview it can't back up. ── */}
      {certificateConfig && (
        <Section background="default" className="py-12 md:py-16">
          <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="border-border/70 relative aspect-[1920/1358] w-full overflow-hidden rounded-2xl border shadow-lg">
              <Image
                src="/certificates/gen-ai-certificate-preview.png"
                alt="Sample Stively certificate of completion"
                fill
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                Certificate of completion
              </Badge>
              <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                A real, verifiable certificate - not just a PDF
              </h2>
              <p className="text-muted-foreground text-pretty">
                Finish the course and its assessments, and you get a certificate with a unique ID and QR
                code. Anyone can scan it to confirm it&apos;s genuine on our public verification page - no
                guessing whether a certificate is real.
              </p>
              <ul className="flex flex-col gap-2.5">
                {["Personalized with your name automatically", "Unique certificate ID", "Publicly verifiable, anytime"].map((item) => (
                  <li key={item} className="text-foreground flex items-start gap-2.5 text-sm">
                    <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      )}

      {/* ── FAQ ──────────────────────────────────────────── */}
      <Section background="muted" className="py-12 md:py-16 lg:py-20">
        <Container className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {courseFaqs.map((item, index) => (
              <AccordionItem key={item.question} value={`course-faq-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* ── FINAL CTA - extra bottom padding so the fixed mobile bar never covers it. ── */}
      <Section background="inverted" className="py-14 pb-28 md:py-20 lg:pb-20">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {payable != null
              ? `Learn AI properly for ${formatPrice(payable, offering.currency)}.`
              : "Ready to start learning?"}
          </h2>
          {saleEndsAt && (
            <SaleCountdown
              endsAt={saleEndsAt.toISOString()}
              className="text-warning bg-warning/10 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            />
          )}
          <ul className="text-ink-muted-foreground flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            {["Lifetime access", "Certificate included", "Quizzes and practical exercises"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="text-brand-teal size-4" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          {cta && (
            <Button size="lg" variant="inverse" asChild className="w-full sm:w-auto sm:px-10">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )}
        </Container>
      </Section>

      {/* Persistent mobile purchase bar. pl-16 keeps the price clear of the floating chat widget pinned to the same corner. */}
      {cta && payable != null && (
        <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 pl-16">
            <div className="flex flex-col">
              <span className="text-foreground font-display text-lg font-semibold tabular-nums">
                {formatPrice(payable, offering.currency)}
              </span>
              {hasAnchorPrice && (
                <span className="text-muted-foreground text-xs line-through tabular-nums">
                  {formatPrice(anchor!, offering.currency)}
                </span>
              )}
            </div>
            <Button asChild className="max-w-[60%] flex-1">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export { CourseDetailView };
