import type { Metadata } from "next";
import { MessageCircle, ShieldCheck, FileCheck, MessagesSquare, Rocket } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { getFeaturedPortfolioItems } from "@/lib/queries/portfolio";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
import { TrustStrip } from "@/components/sections/trust-strip";
import { PortfolioCard } from "@/components/sections/portfolio-showcase";
import { StartProjectForm } from "@/components/forms/start-project-form";
import { Card } from "@/components/ui/card";

const TITLE = "Start Your Project - Get a Callback Today";
const DESCRIPTION =
  "Tell us what you're building and we'll call you back the same day. Real quotes you approve before we start, real payments through Razorpay, and a dashboard where you can track everything.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/start-project" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/start-project`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
  // Ad-landing page - not meant to rank organically or dilute /contact's
  // search equity, so it's excluded from the sitemap and from indexing.
  robots: { index: false, follow: true },
};

const STEPS = [
  {
    icon: MessagesSquare,
    title: "We call you",
    description: "A real person calls the same day to understand what you need and answer questions.",
  },
  {
    icon: FileCheck,
    title: "You get a quote",
    description: "A clear, itemized price. Nothing starts until you review and approve it.",
  },
  {
    icon: Rocket,
    title: "We start building",
    description: "Pay your first installment through Razorpay and track every update from your own dashboard.",
  },
];

/**
 * Dedicated Google Ads landing page - a single, form-first page built for
 * paid traffic, not a variant of the Contact page (different intent: this
 * visitor is already sold, they just need a fast way to hand over details).
 * The floating light form card on the dark hero is the page's one
 * deliberate visual move: a calm, bright surface for handing over contact
 * details set against the same ambient dark marketing canvas the rest of
 * the site uses - the founder's own brief was "attractive and trustworthy,
 * should not feel like a scam," so the card reads as a storefront counter,
 * not another dark full-bleed sales pitch.
 */
export default async function StartProjectPage() {
  const portfolioItems = await getFeaturedPortfolioItems(3);

  return (
    <>
      <Section
        background="inverted"
        className="texture-noise relative overflow-hidden py-20 md:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 1000px 560px at 10% 0%, oklch(0.541 0.216 265.75 / 0.35), transparent 60%)," +
              "radial-gradient(ellipse 700px 520px at 55% -10%, oklch(0.58 0.19 232.9 / 0.28), transparent 55%)," +
              "radial-gradient(ellipse 760px 600px at 95% 60%, oklch(0.746 0.127 200.01 / 0.2), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="text-ink-foreground/[0.05] bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]"
        />

        <Container className="relative flex flex-col items-center gap-14 lg:flex-row lg:items-start lg:gap-10">
          <div className="flex flex-col items-center gap-6 text-center lg:w-[48%] lg:shrink-0 lg:items-start lg:pt-6 lg:text-left">
            <span className="border-ink-border-strong text-ink-muted-foreground inline-flex items-center gap-2 rounded-full border bg-white/[0.04] px-3.5 py-1.5 font-mono text-xs font-medium tracking-widest uppercase">
              <span
                aria-hidden="true"
                className="from-primary via-brand-iris to-brand-teal size-1.5 rounded-full bg-linear-to-br"
              />
              Start a project
            </span>

            <h1
              className="font-display text-balance font-semibold tracking-[-0.03em]"
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)", lineHeight: 1.05 }}
            >
              Tell us what you&apos;re building. We&apos;ll call you back today.
            </h1>

            <p className="text-ink-muted-foreground max-w-xl text-lg text-pretty">
              Fill in a few details and a real person from our team will reach out - no chatbot, no
              hidden fees. You review and approve every quote before anything starts.
            </p>

            <ul className="flex flex-col gap-3 text-left">
              {[
                "Real Razorpay payments, split into installments you agree to",
                "You approve every quote before we start a single line of work",
                "Track progress, chat, and documents from your own client dashboard",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <ShieldCheck className="text-brand-teal mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                  <span className="text-ink-foreground/90 text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:flex-1">
            <Reveal>
              <Card className="shadow-glow-xl mx-auto max-w-lg gap-0 p-6 md:p-8">
                <h2 className="text-foreground mb-1 font-display text-xl font-semibold">
                  Start your project
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Takes under a minute. We never share your details.
                </p>
                <StartProjectForm />
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      <TrustStrip />

      {portfolioItems.length > 0 && (
        <Section background="muted">
          <Container className="flex flex-col gap-10">
            <div className="flex max-w-2xl flex-col gap-3">
              <Eyebrow>Our work</Eyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
                Real products, shipped and live
              </h2>
              <p className="text-muted-foreground text-lg text-pretty">
                Not mockups - live sites you can visit right now.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item, index) => (
                <Reveal key={item.id} delay={index * 60} className="h-full">
                  <PortfolioCard item={item} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section>
        <Container className="flex flex-col gap-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <Eyebrow>What happens next</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Three steps from submit to build
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 80}>
                <div className="border-border bg-surface-elevated flex h-full flex-col gap-3 rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <step.icon className="text-primary size-4.5" aria-hidden="true" />
                    </span>
                    <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="text-foreground font-display text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section background="inverted" className="texture-noise relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% 0%, oklch(0.541 0.216 265.75 / 0.3), transparent 65%)",
          }}
        />
        <Container className="relative flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Prefer to just message us?
          </h2>
          <p className="text-ink-muted-foreground max-w-xl text-lg text-pretty">
            Skip the form entirely and start a conversation on WhatsApp right now.
          </p>
          <a
            href={getWhatsAppUrl("/start-project")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            <MessageCircle className="size-4.5" aria-hidden="true" />
            Chat with us on WhatsApp
          </a>
        </Container>
      </Section>
    </>
  );
}
