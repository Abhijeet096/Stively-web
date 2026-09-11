import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download, ShieldCheck, Infinity as InfinityIcon, Library } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/sections/cta-section";
import { getDigitalStoreOfferings } from "@/features/offerings/server/queries";
import { DigitalProductCard } from "@/features/offerings/components/digital-product-card";

export const metadata: Metadata = {
  title: "Digital Store",
  description:
    "Practical eBooks and prompt packs from Stively - instant download, built for real study, work and career use.",
  alternates: { canonical: "/digital-store" },
};

const TRUST_STRIP = [
  { icon: Download, label: "Instant Access", sub: "Download right after payment" },
  { icon: ShieldCheck, label: "Secure Payments", sub: "100% safe, powered by Razorpay" },
  { icon: InfinityIcon, label: "Yours to Keep", sub: "Re-download any time before expiry" },
  { icon: Library, label: "Growing Library", sub: "New products added regularly" },
] as const;

/**
 * The Digital Store catalog - one real, purchasable product today (100
 * Practical AI Prompts) alongside five disabled Coming Soon cards, all read
 * off the same DIGITAL_PRODUCT Offering rows getDigitalStoreOfferings
 * returns. No fabricated filter pills or category tabs here - every
 * product is the same category right now, so a row of filters that filter
 * nothing would be decoration pretending to be function.
 */
export default async function DigitalStorePage() {
  const offerings = await getDigitalStoreOfferings();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      {/* Top padding trimmed well below Section's default/the other py-* heroes -
          this hero sits directly under the navbar with no eyebrow/breadcrumb
          above it, so the large default gap read as genuinely broken empty
          space rather than breathing room. */}
      <Section className="relative overflow-hidden pt-6 pb-14 md:pt-8 md:pb-20 lg:pt-10 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 800px 500px at 10% 0%, oklch(0.541 0.216 265.75 / 0.08), transparent 60%)," +
              "radial-gradient(ellipse 700px 500px at 100% 20%, oklch(0.746 0.127 200.01 / 0.07), transparent 60%)",
          }}
        />
        <Container className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
          <div className="flex w-full flex-col items-start gap-6 lg:w-1/2">
            <span className="text-primary bg-primary/10 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Stively Digital Store
            </span>
            <h1
              className="font-display font-semibold tracking-[-0.03em] text-balance"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)", lineHeight: 1.08 }}
            >
              Digital tools for
              <br />
              <span className="from-primary via-brand-iris to-brand-teal bg-linear-to-r bg-clip-text text-transparent">
                learning, building &amp; working smarter
              </span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-base text-pretty sm:text-lg">
              Practical eBooks and prompt packs, built by Stively - instant download, real use from day one.
            </p>
            <Button size="lg" asChild>
              <Link href="#products">Explore Products</Link>
            </Button>

            <ul className="mt-2 grid w-full grid-cols-2 gap-x-6 gap-y-4 sm:max-w-md">
              {TRUST_STRIP.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span className="border-border bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-full border">
                    <Icon className="text-primary size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{label}</span>
                    <span className="text-muted-foreground text-xs">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-md lg:w-1/2 lg:max-w-none">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src="/digital-store/store-hero.png"
                alt="Stively Digital Store - practical eBooks and prompt packs"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <Section background="muted" id="products" className="scroll-mt-20 py-16 md:py-20">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-foreground text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Featured Products
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm text-pretty sm:text-base">
              Our first release, plus what&apos;s coming next.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {offerings.map((offering) => (
              <DigitalProductCard key={offering.id} offering={offering} />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Invest in skills that work for you."
        description="Practical digital products. Real results. A brighter future."
        actionLabel="Explore Products"
        actionHref="#products"
        inverted
      />
    </>
  );
}
