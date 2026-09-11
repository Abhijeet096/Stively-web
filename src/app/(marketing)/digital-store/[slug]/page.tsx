import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ChevronRight, ShieldCheck, Download, Infinity as InfinityIcon, CheckCircle2 } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FAQSection } from "@/components/sections/faq-section";
import { GuestCheckoutForm } from "@/features/orders/components/guest-checkout-form";
import { getOfferingBySlug } from "@/features/offerings/server/queries";

interface DigitalProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DigitalProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getOfferingBySlug(slug);
  if (!offering || offering.category !== "DIGITAL_PRODUCT") return {};

  return {
    title: offering.title,
    description: offering.shortDescription,
    alternates: { canonical: `/digital-store/${offering.slug}` },
    openGraph: offering.thumbnailUrl
      ? { images: [{ url: `${siteConfig.url}${offering.thumbnailUrl}` }] }
      : undefined,
  };
}

const WHAT_YOU_GET = [
  "100 ready-to-use AI prompts across 5 real categories",
  "Study & Learning, Career & Job Search, Work & Productivity",
  "Content & Creativity, Business & Everyday Life",
  "A clean, printable PDF you keep forever",
] as const;

const FAQ_ITEMS = [
  {
    question: "How do I receive the PDF?",
    answer:
      "Right after payment you're taken straight to a download page, and the same link is emailed to you - no account or password needed.",
  },
  {
    question: "Is this a one-time payment?",
    answer: "Yes - one payment, the file is yours to keep. No subscription, no recurring charge.",
  },
  {
    question: "Can I access it on my phone?",
    answer: "Yes - it's a standard PDF, so it opens on any phone, tablet or computer.",
  },
  {
    question: "What if my download link stops working?",
    answer: `Your download stays active for 30 days from purchase. If it expires, email ${siteConfig.contactEmail} with your order email and we'll send a fresh link.`,
  },
] as const;

/**
 * The Digital Store's own product page - not the generic /offerings/[slug]
 * (built for courses: curriculum outline, instructor, difficulty). A
 * one-off downloadable product needs none of that, so this is a small,
 * purpose-built layout instead of forcing course furniture onto a book.
 */
export default async function DigitalProductPage({ params }: DigitalProductPageProps) {
  const { slug } = await params;
  const offering = await getOfferingBySlug(slug);
  if (!offering || offering.category !== "DIGITAL_PRODUCT" || offering.status !== "PUBLISHED") {
    notFound();
  }

  const headerList = await headers();
  const nonce = headerList.get("x-nonce") ?? undefined;

  const price = offering.discountPrice ?? offering.price;
  const hasAnchorPrice = offering.discountPrice != null && offering.price != null && offering.discountPrice < offering.price;
  const percentOff = hasAnchorPrice ? Math.round((1 - offering.discountPrice! / offering.price!) * 100) : null;

  return (
    <>
      {/* Top padding trimmed well below Section's default - this page has
          nothing above the breadcrumb (no hero, no eyebrow), so the large
          default gap under the sticky navbar read as broken empty space
          rather than breathing room - see the matching fix on
          /digital-store's own hero. */}
      <Section className="pt-6 pb-12 md:pt-8 md:pb-16">
        <Container className="flex flex-col gap-10">
          <nav aria-label="Breadcrumb" className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Link href="/digital-store" className="hover:text-foreground">
              Digital Store
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-foreground truncate">{offering.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* ── Product image ─────────────────────────── */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
                {offering.thumbnailUrl && (
                  <Image
                    src={offering.thumbnailUrl}
                    alt={offering.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* ── Details + purchase ────────────────────── */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {offering.featured && <Badge variant="destructive">Bestseller</Badge>}
                <h1 className="font-display text-foreground text-3xl font-semibold tracking-[-0.02em] text-balance sm:text-4xl">
                  {offering.title}
                </h1>
              </div>

              {/* Price + buy form come immediately after the title, before
                  the description/feature list below - a page this short has
                  no real "sticky sidebar" room (the card is the last, and
                  tallest, thing in this column, so `position: sticky` has
                  zero scrollable range to actually hold it in view), so the
                  reliable fix is putting the button where it's already
                  visible rather than fighting for scroll-based placement.
                  id="buy" is still the mobile bottom bar's scroll target. */}
              <div id="buy">
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-foreground font-display text-3xl font-semibold tabular-nums">
                        {price != null ? formatPrice(price, offering.currency) : "-"}
                      </span>
                      {hasAnchorPrice && (
                        <>
                          <span className="text-muted-foreground text-base line-through tabular-nums">
                            {formatPrice(offering.price!, offering.currency)}
                          </span>
                          {percentOff != null && percentOff > 0 && <Badge variant="success">{percentOff}% OFF</Badge>}
                        </>
                      )}
                    </div>

                    {offering.allowsGuestCheckout && price != null ? (
                      <GuestCheckoutForm
                        offering={{
                          id: offering.id,
                          title: offering.title,
                          price,
                          currency: offering.currency,
                          promptsPackPrice: offering.promptsPackPrice,
                        }}
                        nonce={nonce}
                        ctaLabel="Buy Now for"
                        namePlaceholder="Your name"
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">This product isn&apos;t available for purchase right now.</p>
                    )}

                    <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Secure payment powered by Razorpay
                    </p>

                    <ul className="border-border/70 flex flex-col gap-2.5 border-t pt-4">
                      <li className="text-foreground flex items-center gap-2.5 text-sm">
                        <Download className="text-primary size-4 shrink-0" aria-hidden="true" />
                        Instant download after payment
                      </li>
                      <li className="text-foreground flex items-center gap-2.5 text-sm">
                        <InfinityIcon className="text-primary size-4 shrink-0" aria-hidden="true" />
                        Re-download any time for 30 days
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <p className="text-muted-foreground text-base text-pretty">{offering.longDescription}</p>

              <ul className="flex flex-col gap-2.5">
                {WHAT_YOU_GET.map((item) => (
                  <li key={item} className="text-foreground flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <FAQSection heading="Frequently asked questions" items={[...FAQ_ITEMS]} />

      {/* Extra bottom clearance so the fixed mobile buy bar never covers the last FAQ item. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      {/* Persistent mobile buy bar - always visible, no scrolling needed to
          reach a purchase action, same pattern as the course detail page's
          own bottom bar. Desktop instead gets the sticky card above. */}
      {offering.allowsGuestCheckout && price != null && (
        <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 pl-16">
            <div className="flex flex-col">
              <span className="text-foreground font-display text-lg font-semibold tabular-nums">
                {formatPrice(price, offering.currency)}
              </span>
              {hasAnchorPrice && (
                <span className="text-muted-foreground text-xs line-through tabular-nums">
                  {formatPrice(offering.price!, offering.currency)}
                </span>
              )}
            </div>
            <Button asChild className="max-w-[60%] flex-1">
              <Link href="#buy">Buy Now</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
