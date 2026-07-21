import { siteConfig } from "@/config/site";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JsonLd } from "@/components/shared/json-ld";
import { SERVICES } from "@/lib/services-data";

/**
 * Describes offering categories and capability, not completed projects -
 * deliberately no client names, project counts, or case studies here (none
 * exist yet to show honestly). See the implementation plan for this page.
 */
function ServicesGrid() {
  return (
    <Section background="default">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Software Development",
          provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          areaServed: "Worldwide",
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Software Development Services",
            itemListElement: SERVICES.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service.title,
                description: service.description,
              },
            })),
          },
        }}
      />
      <Container className="flex flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <Eyebrow>What we build</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Software, built the way an in-house team would build it
          </h2>
          <p className="text-muted-foreground text-lg text-pretty">
            Six capability areas backed by a talent pipeline trained on real projects, not a
            freelancer roster.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <Reveal key={service.title} delay={index * 60} className="h-full">
              <Card variant="interactive" className="h-full">
                <CardHeader className="gap-3">
                  <span
                    className="from-primary/15 via-brand-iris/10 to-brand-teal/15 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br"
                    aria-hidden="true"
                  >
                    <service.icon className="size-6" />
                  </span>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { ServicesGrid };
