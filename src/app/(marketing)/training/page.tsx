import type { Metadata } from "next";
import Link from "next/link";
import {
  SearchX,
  FolderKanban,
  Award,
  Infinity as InfinityIcon,
  GraduationCap,
  PlayCircle,
  PencilRuler,
  ClipboardCheck,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import { getOfferings } from "@/features/offerings/server/queries";
import { OfferingCard } from "@/features/offerings/components/offering-card";
import { MODE_LABEL, DIFFICULTY_LABEL, formatOfferingPrice } from "@/features/offerings/lib/labels";
import { formatPrice, cn } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { TrainingHero } from "@/components/sections/training-hero";
import { EmptyState } from "@/components/sections/empty-state";
import { CTASection } from "@/components/sections/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Training Programs",
    description:
      "Practical, project-based training from Stively - learn AI and prompt engineering, frontend, backend, and fullstack development, get certified, and build something real.",
    alternates: { canonical: "/training" },
  };
}

/**
 * Structural facts about how every program is built - deliberately not
 * audience-size or outcome claims ("500+ learners", "90% placed"), which
 * would be unsubstantiated assertions rather than something the product
 * itself guarantees. Same no-fabricated-proof rule the portfolio and
 * testimonials surfaces already follow.
 */
const HIGHLIGHTS = [
  { icon: FolderKanban, title: "Practical projects", description: "Build real work, not toy examples" },
  { icon: Award, title: "Certificates", description: "Showcase what you finished" },
  { icon: InfinityIcon, title: "Lifetime access", description: "Including every future update" },
  { icon: GraduationCap, title: "Beginner friendly", description: "Step-by-step, no prior experience" },
] as const;

const WHY_STIVELY = [
  {
    icon: PencilRuler,
    title: "Practical & project-based",
    description: "You learn by building real things, not by memorizing theory you'll never use.",
  },
  {
    icon: GraduationCap,
    title: "Beginner friendly",
    description: "Every program starts from the ground up with a clear, step-by-step path.",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Finish a program and get a certificate you can actually show people.",
  },
  {
    icon: InfinityIcon,
    title: "Lifetime access",
    description: "Enrol once, keep the material - plus everything we add to it later.",
  },
] as const;

const HOW_IT_WORKS = [
  { icon: PlayCircle, step: "1", title: "Learn", description: "Watch short, structured video lessons." },
  { icon: PencilRuler, step: "2", title: "Practice", description: "Work through hands-on exercises and projects." },
  { icon: ClipboardCheck, step: "3", title: "Evaluate", description: "Pass a quiz on each lesson before moving on." },
  { icon: BadgeCheck, step: "4", title: "Complete", description: "Get certified and apply what you've built." },
] as const;

const TRAINING_FAQS = [
  {
    question: "Do I get a certificate?",
    answer: "Yes. Every program issues a certificate of completion once you finish it.",
  },
  {
    question: "Is this suitable for beginners?",
    answer:
      "Yes. Every program is built to start from the basics and assumes no prior experience unless the program page says otherwise.",
  },
  {
    question: "Do I get lifetime access?",
    answer:
      "Yes. Once you enrol you keep access to the material permanently, including any lessons or updates we add later.",
  },
  {
    question: "How is my progress checked?",
    answer:
      "Each lesson ends with a short quiz. You need to pass it before the next lesson unlocks, so the certificate reflects real understanding rather than just watching to the end.",
  },
  {
    question: "How do I pay?",
    answer:
      "Payment is handled securely by Razorpay at checkout - UPI, cards, net banking and wallets are all supported.",
  },
];

/**
 * Sources TRAINING-category Offerings, not the legacy Program table this
 * page originally read from: every real course now lives in the Offering
 * catalog (see prisma/seed-*-course.ts).
 *
 * The goal chips filter on Offering.tags rather than a separate taxonomy -
 * real metadata already on the record, so a chip can never advertise a
 * category that has nothing behind it (the chip list is derived from the
 * offerings themselves).
 */
export default async function TrainingListingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; goal?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const goal = params.goal?.trim() || undefined;

  const { offerings } = await getOfferings({
    q: search,
    category: "TRAINING",
    sort: "featured",
  });

  const goals = [...new Set(offerings.flatMap((offering) => offering.tags))].sort();
  const visible = goal ? offerings.filter((offering) => offering.tags.includes(goal)) : offerings;

  const featured = visible.find((offering) => offering.featured);
  const rest = featured ? visible.filter((offering) => offering.id !== featured.id) : visible;

  return (
    <>
      <TrainingHero />

      {/* Value case settled before the first scroll on mobile. */}
      <Section background="muted" className="py-10 md:py-12 lg:py-14">
        <Container>
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground text-sm font-semibold">{title}</span>
                  <span className="text-muted-foreground text-xs text-pretty">{description}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section background="default" id="programs" className="py-14 md:py-20 lg:py-24">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              What are you trying to learn?
            </h2>
            <p className="text-muted-foreground max-w-2xl text-pretty">
              Pick a goal, or browse everything we currently run.
            </p>
          </div>

          {goals.length > 0 && (
            // Horizontally scrollable on mobile rather than wrapping into a tall block that pushes the courses below the fold.
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                <GoalChip label="All" href="/training#programs" active={!goal} />
                {goals.map((tag) => (
                  <GoalChip
                    key={tag}
                    label={tag}
                    href={`/training?goal=${encodeURIComponent(tag)}#programs`}
                    active={goal === tag}
                  />
                ))}
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches that yet"
              description="Try another goal, or browse everything we currently run."
              actionLabel="View all programs"
              actionHref="/training"
            />
          ) : (
            <div className="flex flex-col gap-6">
              {featured && <FeaturedProgramCard offering={featured} />}
              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((offering) => (
                    <OfferingCard key={offering.id} offering={offering} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>

      <Section background="muted" className="py-14 md:py-20 lg:py-24">
        <Container className="flex flex-col gap-8">
          <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Why learn with Stively?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_STIVELY.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="h-full">
                <CardContent className="flex flex-col gap-2">
                  <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-foreground font-semibold">{title}</span>
                  <span className="text-muted-foreground text-sm text-pretty">{description}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="default" className="py-14 md:py-20 lg:py-24">
        <Container className="flex flex-col gap-8">
          <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            How Stively training works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <li key={step}>
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-muted-foreground font-mono text-xs tracking-widest">
                        STEP {step}
                      </span>
                    </div>
                    <span className="text-foreground font-semibold">{title}</span>
                    <span className="text-muted-foreground text-sm text-pretty">{description}</span>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section background="muted" id="find-your-program" className="py-14 md:py-20 lg:py-24">
        <Container className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* min-w-0: a grid item defaults to min-width:auto, so the table's min-content width would widen this column past the viewport instead of letting the wrapper scroll. */}
          <div className="flex min-w-0 flex-col gap-5">
            <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Find the right program for you
            </h2>
            {offerings.length > 0 && (
              <div className="border-border/70 bg-background overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offerings.map((offering) => (
                      <TableRow key={offering.id}>
                        <TableCell>
                          <Link href={`/offerings/${offering.slug}`} className="hover:underline">
                            {offering.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {offering.difficulty ? DIFFICULTY_LABEL[offering.difficulty] : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {offering.duration ?? "-"}
                        </TableCell>
                        <TableCell className="text-foreground text-right font-medium tabular-nums">
                          {formatOfferingPrice(
                            offering.discountPrice ?? offering.price,
                            offering.currency,
                            offering.pricingType,
                            formatPrice
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Still not sure?{" "}
              <Link href="/contact" className="text-primary font-medium hover:underline">
                Talk to an advisor
              </Link>{" "}
              and we&apos;ll point you at the right one.
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <h2 className="text-foreground font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {TRAINING_FAQS.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Start learning with Stively today"
        description="Practical skills. Real projects. A brighter career."
        actionLabel="Explore programs"
        actionHref="#programs"
        inverted
      />
    </>
  );
}

function GoalChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-foreground/20 hover:bg-accent"
      )}
    >
      {label}
    </Link>
  );
}

/** The flagship program gets a wide, high-contrast slot instead of competing as one card in a grid - the single highest-intent thing on this page. */
function FeaturedProgramCard({
  offering,
}: {
  offering: Awaited<ReturnType<typeof getOfferings>>["offerings"][number];
}) {
  const payable = offering.discountPrice ?? offering.price;
  const hasAnchor = offering.discountPrice != null && offering.price != null;
  const percentOff =
    hasAnchor && offering.price! > 0
      ? Math.round(((offering.price! - offering.discountPrice!) / offering.price!) * 100)
      : null;

  return (
    <Card variant="interactive" className="border-primary/30 overflow-hidden">
      <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col gap-3 lg:max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gradient">Bestseller</Badge>
            {offering.difficulty && <Badge variant="secondary">{DIFFICULTY_LABEL[offering.difficulty]}</Badge>}
            <Badge variant="outline">{MODE_LABEL[offering.mode]}</Badge>
            {offering.duration && <Badge variant="outline">{offering.duration}</Badge>}
          </div>
          <h3 className="text-foreground font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {offering.title}
          </h3>
          <p className="text-muted-foreground text-pretty">{offering.shortDescription}</p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-foreground font-display text-3xl font-semibold tabular-nums">
              {formatOfferingPrice(payable, offering.currency, offering.pricingType, formatPrice)}
            </span>
            {hasAnchor && (
              <>
                <span className="text-muted-foreground text-base line-through tabular-nums">
                  {formatPrice(offering.price!, offering.currency)}
                </span>
                {percentOff != null && percentOff > 0 && (
                  <Badge variant="success">{percentOff}% OFF</Badge>
                )}
              </>
            )}
          </div>
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href={`/offerings/${offering.slug}`}>
              View course
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
