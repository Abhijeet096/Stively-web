import Image from "next/image";
import type { PortfolioItem } from "@prisma/client";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PORTFOLIO_CATEGORY_LABEL } from "@/components/sections/portfolio-showcase";

/** The case-study page's opening section - title, tagline, concept/client + category badges, cover image, and the external "Visit live site" CTA if one exists. */
function CaseStudyHero({ item }: { item: PortfolioItem }) {
  const isConcept = !item.clientName;

  return (
    <Section background="default" className="pt-12 pb-0 md:pt-16">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Eyebrow>{item.industry ?? "Our work"}</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isConcept ? "default" : "secondary"}>{isConcept ? "Portfolio Concept" : "Client Project"}</Badge>
            <Badge variant="outline">{PORTFOLIO_CATEGORY_LABEL[item.category]}</Badge>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
            {item.title}
          </h1>
          {item.tagline && <p className="text-muted-foreground max-w-2xl text-lg text-pretty">{item.tagline}</p>}
          {item.liveUrl && (
            <Button variant="outline" asChild className="w-fit">
              <a href={item.liveUrl} target="_blank" rel="noopener noreferrer">
                Visit live site
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>

        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-2xl">
          <Image
            src={item.imageUrl}
            alt={`Cover image for ${item.title}`}
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover object-top"
          />
        </div>
      </Container>
    </Section>
  );
}

export { CaseStudyHero };
