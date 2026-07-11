import { Code2, Globe, Bot, Smartphone, Plug, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ServiceOffering {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SERVICES: ServiceOffering[] = [
  {
    icon: Globe,
    title: "Web Application Development",
    description:
      "Full-stack web applications built on modern, maintainable frameworks - not template sites.",
  },
  {
    icon: Code2,
    title: "Custom Software Development",
    description:
      "Software built around how your business actually works, not the other way around.",
  },
  {
    icon: Bot,
    title: "AI & Automation",
    description:
      "Practical automation and AI integration that removes repetitive work, not novelty features.",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    description:
      "Cross-platform mobile applications built on the same engineering standards as our web work.",
  },
  {
    icon: Plug,
    title: "API & Systems Integration",
    description: "Connecting the tools you already use, cleanly, without brittle one-off scripts.",
  },
  {
    icon: Users2,
    title: "Technical Consulting",
    description:
      "Architecture and technology decisions reviewed before they become expensive to change.",
  },
];

/**
 * Describes offering categories and capability, not completed projects -
 * deliberately no client names, project counts, or case studies here (none
 * exist yet to show honestly). See the implementation plan for this page.
 */
function ServicesGrid() {
  return (
    <Section background="default">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What we build</h2>
          <p className="text-muted-foreground max-w-xl">
            Software development services backed by a talent pipeline trained on real projects.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <service.icon className="text-primary mb-2 size-6" aria-hidden="true" />
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { ServicesGrid };
