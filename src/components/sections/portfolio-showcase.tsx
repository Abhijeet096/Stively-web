import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import type { PortfolioItem, PortfolioCategory } from "@prisma/client";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const PORTFOLIO_CATEGORY_LABEL: Record<PortfolioCategory, string> = {
  WEBSITE: "Website",
  WEB_APP: "Web App",
  ECOMMERCE: "E-commerce",
  MOBILE_APP: "Mobile App",
  BRANDING: "Branding",
  OTHER: "Project",
};

export interface PortfolioShowcaseProps {
  items: PortfolioItem[];
}

/**
 * Homepage teaser for the real, shipped work shown on /work - the concrete
 * proof ServicesGrid's own comment says doesn't exist yet ("no fabricated
 * case studies... none exist yet to show honestly"). Renders nothing when
 * `items` is empty (caller already gates on this, matching the Testimonials
 * section's exact pattern), so an unpopulated showcase never appears as a
 * broken or empty section.
 *
 * Each card's cover image sits in a fixed aspect-video box so the grid
 * never shifts layout as images load (CLS), and next/image handles WebP/AVIF
 * negotiation + lazy loading below the fold automatically - no custom
 * image-loading logic needed.
 */
function PortfolioShowcase({ items }: PortfolioShowcaseProps) {
  return (
    <Section background="muted">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <Eyebrow>Our work</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
              Real products, shipped and live
            </h2>
            <p className="text-muted-foreground text-lg text-pretty">
              A look at what we&apos;ve actually built - not mockups, live sites you can visit.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/work">
              View all work
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={index * 60} className="h-full">
              <PortfolioCard item={item} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/**
 * `clientName` doubles as the Portfolio-Concept/Client-Project distinction -
 * null means a self-initiated concept piece (no real client to name), a
 * real value means actual client work. No separate boolean/enum needed for
 * that one bit, it already falls out of the field's existing meaning.
 */
function PortfolioCard({ item }: { item: PortfolioItem }) {
  const isConcept = !item.clientName;

  return (
    <Card variant="interactive" className="group h-full gap-0 overflow-hidden py-0">
      <div className="bg-muted relative aspect-video w-full overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={`Cover image for ${item.title}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {item.liveUrl && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-end justify-end bg-linear-to-t from-black/50 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-black">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={isConcept ? "default" : "secondary"} className="w-fit">
            {isConcept ? "Portfolio Concept" : "Client Project"}
          </Badge>
          <Badge variant="outline" className="w-fit">
            {PORTFOLIO_CATEGORY_LABEL[item.category]}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-display text-foreground text-lg font-semibold">{item.title}</h3>
          {(item.industry || item.clientName) && (
            <p className="text-muted-foreground text-sm">
              {item.clientName ? item.clientName : item.industry}
            </p>
          )}
        </div>

        <p className="text-muted-foreground line-clamp-2 text-sm text-pretty">{item.summary}</p>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-muted-foreground font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {item.liveUrl && (
          <Button variant="outline" size="sm" asChild className="mt-auto w-fit">
            <a href={item.liveUrl} target="_blank" rel="noopener noreferrer">
              Live Preview
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

export { PortfolioShowcase, PortfolioCard };
