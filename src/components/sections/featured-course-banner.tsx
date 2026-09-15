import Link from "next/link";
import { PlayCircle, ShieldCheck, ArrowRight } from "lucide-react";
import type { Offering } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { getOfferingPricing } from "@/features/offerings/lib/pricing";
import { SaleCountdown } from "@/features/offerings/components/sale-countdown";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { HeroFeatheredImage } from "@/components/shared/hero-feathered-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * A dedicated homepage slot for the one thing the founding-price course page
 * (AD-024) can't do on its own: catch someone who was never going to click
 * "Training" in the nav. Replaces WhyStivelyComparison's old slot (AD-027) -
 * that section repeated the same "no black box" claim TrustStrip already
 * makes right above it, twice more, before showing anything concrete. This
 * shows something real and specific instead: the actual course, its actual
 * price, and how long that price lasts - same getOfferingPricing/
 * SaleCountdown machinery as the course page itself, so the price and
 * countdown here can never say something different from what checkout
 * actually charges.
 */
function FeaturedCourseBanner({ offering }: { offering: Offering }) {
  const { payable, anchor, percentOff, saleEndsAt } = getOfferingPricing(offering);
  const image = offering.bannerUrl ?? offering.thumbnailUrl;

  return (
    <Section background="default">
      <Container>
        <Reveal>
          <div className="bg-ink text-ink-foreground relative flex flex-col overflow-hidden rounded-2xl lg:flex-row lg:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 700px 420px at 90% 0%, oklch(0.541 0.216 265.75 / 0.28), transparent 60%)," +
                  "radial-gradient(ellipse 600px 460px at 5% 100%, oklch(0.746 0.127 200.01 / 0.14), transparent 60%)",
              }}
            />

            <div className="flex flex-col gap-5 p-8 sm:p-10 lg:w-[54%] lg:shrink-0 lg:p-12">
              <Badge variant="gradient" className="w-fit">
                Featured course
              </Badge>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {offering.title}
              </h2>
              <p className="text-ink-muted-foreground max-w-md text-pretty">{offering.shortDescription}</p>

              <ul className="text-ink-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <li className="flex items-center gap-1.5">
                  <PlayCircle className="text-brand-teal size-4" aria-hidden="true" />
                  Self-paced
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="text-brand-teal size-4" aria-hidden="true" />
                  Certificate included
                </li>
              </ul>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {payable != null && (
                    <span className="font-display text-3xl font-semibold tabular-nums">
                      {formatPrice(payable, offering.currency)}
                    </span>
                  )}
                  {anchor != null && (
                    <>
                      <span className="text-ink-muted-foreground text-lg line-through tabular-nums">
                        {formatPrice(anchor, offering.currency)}
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

              <Button size="lg" variant="inverse" asChild className="w-fit">
                <Link href={`/offerings/${offering.slug}`}>
                  {payable != null ? `Enroll for ${formatPrice(payable, offering.currency)}` : "View course"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="relative aspect-[16/10] w-full lg:aspect-auto lg:h-full lg:flex-1 lg:self-stretch">
              {image ? (
                <HeroFeatheredImage
                  src={image}
                  alt={`${offering.title} preview`}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="size-full"
                  objectPosition="50% 50%"
                />
              ) : (
                <div className="border-ink-border-strong flex size-full items-center justify-center border-t bg-white/[0.03] lg:border-t-0 lg:border-l">
                  <PlayCircle className="text-ink-muted-foreground size-12" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export { FeaturedCourseBanner };
