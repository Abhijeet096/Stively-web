import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";

import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import { getOfferingForDisplay } from "@/features/offerings/server/queries";
import { getAllPublishedPortfolioItems } from "@/lib/queries/portfolio";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
import { HeroSection } from "@/components/sections/hero-section";
import { TrustStrip } from "@/components/sections/trust-strip";
import { ServiceStickyCta } from "@/components/sections/service-sticky-cta";
import { ProcessTimeline } from "@/components/sections/process-timeline";
import { WhyChooseStively } from "@/components/sections/why-choose-stively";
import { TechStack } from "@/components/sections/tech-stack";
import { IndustriesGrid } from "@/components/sections/industries-grid";
import { PortfolioCard } from "@/components/sections/portfolio-showcase";
import { FAQSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PROBLEM_POINTS,
  SOLUTION_POINTS,
  PROCESS_STEPS,
  FEATURES,
  BENEFITS,
  INDUSTRIES,
  WHY_US_POINTS,
  FAQ_ITEMS,
} from "./content";

const TITLE = "Website Development Services in India";
const DESCRIPTION =
  "Custom website development for businesses that need more than a template - fixed-scope pricing, real code ownership, and an SEO foundation built in from launch.";
const HERO_ID = "website-development-hero";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/website-development" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/website-development`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * The canonical SEO/conversion landing page for website development -
 * /offerings/website-development (the catalog/pricing listing) links up to
 * this page rather than the two competing for the same search intent. Real
 * data throughout: the Pricing section reads the actual "Startup Website
 * Package" Offering (not an invented tier), and Portfolio reuses the same
 * real, published portfolio items /work shows - nothing here is fabricated
 * copy standing in for a statistic or a client quote that doesn't exist yet.
 */
export default async function WebsiteDevelopmentPage() {
  const [offering, portfolioItems] = await Promise.all([
    getOfferingForDisplay("startup-website-package"),
    getAllPublishedPortfolioItems(),
  ]);

  const websiteProjects = portfolioItems.filter((item) => item.category === "WEBSITE").slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Services", item: `${siteConfig.url}/services` },
            {
              "@type": "ListItem",
              position: 3,
              name: "Website Development",
              item: `${siteConfig.url}/website-development`,
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Website Development",
          name: "Website Development",
          description: DESCRIPTION,
          provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          areaServed: "IN",
          ...(offering
            ? {
                offers: {
                  "@type": "Offer",
                  name: offering.title,
                  price: (offering.price! / 100).toString(),
                  priceCurrency: offering.currency,
                  url: `${siteConfig.url}/checkout/${offering.slug}`,
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <HeroSection
        id={HERO_ID}
        eyebrow="Website Development"
        heading="A website built like software, not a template"
        subheading="Stively designs and builds custom websites on the same modern stack we use for full products - fast, SEO-ready from day one, and handed over with source code you actually own."
        primaryCta={{
          label: "Get a free consultation",
          href: "/start-project",
        }}
        secondaryCta={{ label: "See real work", href: "/work" }}
      />

      <TrustStrip />
      <ServiceStickyCta
        watchId={HERO_ID}
        label="Talk to us about your website"
        ctaLabel="Get a free consultation"
        ctaHref="/start-project"
      />

      {offering && (
        <Section background="default">
          <Container className="flex flex-col gap-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <Eyebrow>What&rsquo;s included</Eyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
                Real numbers from our Starter package, not a marketing estimate
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Reveal className="border-border bg-card flex flex-col items-center gap-2 rounded-2xl border p-6 text-center">
                <Clock className="text-primary size-6" aria-hidden="true" />
                <span className="font-display text-foreground text-2xl font-semibold">
                  {offering.duration}
                </span>
                <span className="text-muted-foreground text-sm">Delivery time</span>
              </Reveal>
              {offering.benefits.map((benefit, index) => (
                <Reveal
                  key={benefit}
                  delay={(index + 1) * 60}
                  className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-2xl border p-6 text-center"
                >
                  <Check className="text-primary size-6" aria-hidden="true" />
                  <span className="text-foreground text-sm font-medium text-pretty">{benefit}</span>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section background="muted">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Most business websites are working against you
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {PROBLEM_POINTS.map((point, index) => (
              <Reveal key={point.title} delay={index * 70} className="flex gap-4">
                <span className="bg-destructive/10 text-destructive flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-foreground text-base font-semibold">{point.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{point.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="default">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>The Stively approach</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              How we build differently
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {SOLUTION_POINTS.map((point, index) => (
              <Reveal key={point.title} delay={index * 70} className="flex gap-4">
                <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-foreground text-base font-semibold">{point.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{point.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <ProcessTimeline
        id="website-development-process"
        eyebrow="Our process"
        heading="Seven stages, the same way every time"
        description="From the first conversation to a live, supported site - no step skipped, no surprise in between."
        steps={PROCESS_STEPS}
        footer={
          <Link
            href="/process"
            className="text-ink-foreground/80 hover:text-ink-foreground inline-flex items-center gap-1.5 text-sm font-medium underline decoration-white/25 underline-offset-4 transition-colors duration-150 hover:decoration-white/50"
          >
            See the full process - timelines and deliverables for every stage
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <Section background="default">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>What you get</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Every website ships with this, standard
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 60} className="h-full">
                <Card variant="interactive" className="h-full">
                  <CardHeader className="gap-3">
                    <span className="from-primary/15 via-brand-iris/10 to-brand-teal/15 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br">
                      <feature.icon className="size-6" aria-hidden="true" />
                    </span>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <WhyChooseStively heading="What this means for your business" reasons={BENEFITS} />

      <TechStack />

      <IndustriesGrid
        eyebrow="Who we build for"
        heading="Websites for every kind of business"
        industries={INDUSTRIES}
      />

      {websiteProjects.length > 0 && (
        <Section background="muted">
          <Container className="flex flex-col gap-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-2xl flex-col gap-3">
                <Eyebrow>Real work</Eyebrow>
                <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
                  Websites we&rsquo;ve actually built
                </h2>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/work">
                  View all work
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {websiteProjects.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} className="h-full">
                  <PortfolioCard item={item} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section background="default">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              What a website with Stively actually costs
            </h2>
            <p className="text-muted-foreground max-w-xl text-pretty">
              One real, fixed-price package to start. Anything bigger gets scoped and quoted for exactly
              what you need.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            {offering && (
              <Reveal className="h-full">
                <Card className="border-primary/30 relative flex h-full flex-col gap-6 overflow-hidden">
                  <span
                    aria-hidden="true"
                    className="from-primary via-brand-iris to-brand-teal absolute inset-x-0 top-0 h-1 bg-linear-to-r"
                  />
                  <CardHeader className="relative">
                    <Badge variant="default" className="mb-1 w-fit">
                      Available now
                    </Badge>
                    <CardTitle className="text-lg">{offering.title}</CardTitle>
                    <CardDescription>{offering.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <p className="font-display text-foreground text-4xl font-semibold tabular-nums">
                      {formatPrice(offering.price!, offering.currency)}
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {offering.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-sm">
                          <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          <span className="text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="relative">
                    <Button size="lg" asChild className="w-full">
                      <Link href={`/checkout/${offering.slug}`}>Buy now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            )}
            <Reveal delay={70} className="h-full">
              <Card variant="ink" className="flex h-full flex-col gap-6">
                <CardHeader>
                  <Badge variant="ink" className="mb-1 w-fit">
                    Custom scope
                  </Badge>
                  <CardTitle className="font-display text-xl">Something bigger</CardTitle>
                  <CardDescription className="text-ink-muted-foreground">
                    Custom design, a CMS, e-commerce, or a full platform with an admin panel and mobile
                    app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <ul className="flex flex-col gap-2.5">
                    {[
                      "Custom design and CMS",
                      "Blog and content sections",
                      "API and third-party integrations",
                      "E-commerce and payment gateways",
                      "Admin panel and mobile app, if needed",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-sm">
                        <Check className="text-brand-teal mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span className="text-ink-foreground/90">{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button variant="inverse" size="lg" asChild className="w-full">
                    <Link href="/contact?type=business&offering=Website%20Development">
                      Request a quote
                    </Link>
                  </Button>
                  <Button variant="outline-inverse" size="sm" asChild className="w-full">
                    <Link href="/pricing">See full pricing breakdown</Link>
                  </Button>
                </CardFooter>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section background="muted">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Why businesses choose us</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              What working with Stively actually looks like
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {WHY_US_POINTS.map((point, index) => (
              <Reveal key={point.title} delay={index * 80}>
                <div className="border-border bg-card flex h-full flex-col gap-3 rounded-2xl border p-6">
                  <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <point.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-foreground text-base font-semibold">{point.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{point.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <FAQSection heading="Website development, answered" items={FAQ_ITEMS} />

      <CTASection
        heading="Ready to build a website that actually works for your business?"
        description="A short call to talk through scope, timeline, and whether this is a fit - no obligation."
        actionLabel="Get a free consultation"
        actionHref="/start-project"
        inverted
        glow
      />
    </>
  );
}
