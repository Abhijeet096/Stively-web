import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getAllPublishedPortfolioItems } from "@/lib/queries/portfolio";
import { JsonLd } from "@/components/shared/json-ld";
import { HeroSection } from "@/components/sections/hero-section";
import { WorkGrid } from "@/components/sections/work-grid";
import { CTASection } from "@/components/sections/cta-section";
import { EmptyState } from "@/components/sections/empty-state";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

const TITLE = "Our Work";
const DESCRIPTION =
  "Real websites and web apps Stively has designed and built - live projects you can visit, not mockups.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${siteConfig.url}/work`,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function WorkPage() {
  const items = await getAllPublishedPortfolioItems();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
            { "@type": "ListItem", position: 2, name: "Our Work", item: `${siteConfig.url}/work` },
          ],
        }}
      />
      {items.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.title,
              url: item.liveUrl ?? `${siteConfig.url}/work`,
            })),
          }}
        />
      )}

      <HeroSection
        eyebrow="Our Work"
        heading="Real products, not mockups"
        subheading="A look at websites and web apps we've designed and built - every project here is live, and you're welcome to click through."
        primaryCta={{ label: "Start a project", href: "/contact?type=business" }}
      />

      <Section background="default">
        <Container>
          {items.length > 0 ? (
            <WorkGrid items={items} />
          ) : (
            <EmptyState
              icon={Briefcase}
              title="Our work is coming to this page soon"
              description="We're putting together a showcase of live projects to feature here. In the meantime, get in touch and we'll happily walk you through recent work directly."
              actionLabel="Get in touch"
              actionHref="/contact?type=business"
            />
          )}
        </Container>
      </Section>

      <CTASection
        heading="Like what you see?"
        description="Tell us about your project - we'll give you a straight answer on scope, timeline, and fit."
        actionLabel="Start a project"
        actionHref="/contact?type=business"
        inverted
      />
    </>
  );
}
