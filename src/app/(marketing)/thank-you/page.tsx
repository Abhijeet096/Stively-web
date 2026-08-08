import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { StartProjectConversion } from "@/components/analytics/start-project-conversion";

const TITLE = "Thank You - We'll Be In Touch";
const DESCRIPTION =
  "Thanks for reaching out to Stively. A real person from our team will call you back today.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/thank-you" },
  // Not a real content page, and not the URL anyone should land on except
  // right after submitting - excluded from indexing/sitemap like
  // /start-project, whose funnel this closes.
  robots: { index: false, follow: true },
};

/**
 * Dedicated conversion URL for the /start-project funnel (form -> this page,
 * not an inline confirmation swap) - the industry-standard pattern for
 * lead-gen funnels. GoogleAnalytics (src/components/analytics/analytics.tsx)
 * already fires a GA4 pageview on this client-side navigation with no extra
 * wiring. The Google Ads *conversion* event is separate and does need
 * explicit wiring - <StartProjectConversion /> below, gated on a
 * same-tab-only sessionStorage handoff so a direct/bookmarked/crawled visit
 * to this page (this route has no other guard against that - it's a plain
 * public page, `noindex` only keeps search engines from listing it) can
 * never fire a false conversion. See that component's own comment for why
 * Google Ads' automatic form-submission detection couldn't be used instead.
 */
export default function ThankYouPage() {
  return (
    <>
      <StartProjectConversion />
      <Section
        background="inverted"
        className="texture-noise relative flex min-h-[70vh] items-center overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 1000px 560px at 50% 0%, oklch(0.541 0.216 265.75 / 0.35), transparent 60%)," +
              "radial-gradient(ellipse 700px 520px at 20% 90%, oklch(0.746 0.127 200.01 / 0.18), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="text-ink-foreground/[0.05] bg-dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]"
        />

        <Container className="relative flex flex-col items-center gap-6 py-20 text-center">
          <span className="from-primary via-brand-iris to-brand-teal flex size-16 items-center justify-center rounded-full bg-linear-to-br">
            <CheckCircle2 className="text-ink-foreground size-8" aria-hidden="true" />
          </span>

          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            Got it — we&apos;ll call you today
          </h1>

          <p className="text-ink-muted-foreground max-w-xl text-lg text-pretty">
            Thanks for reaching out to Stively. A real person from our team will call you back on
            the number you shared. If it&apos;s urgent, message us on WhatsApp right now instead.
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="inverse" asChild>
              <a href={getWhatsAppUrl("/start-project")} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button size="lg" variant="outline-inverse" asChild>
              <Link href="/work">
                See our work
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <Link
            href="/"
            className="text-ink-muted-foreground hover:text-ink-foreground mt-4 text-sm underline underline-offset-4"
          >
            Back to {siteConfig.name}
          </Link>
        </Container>
      </Section>
    </>
  );
}
