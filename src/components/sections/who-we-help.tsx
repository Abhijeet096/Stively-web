import Link from "next/link";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

const AUDIENCES = [
  {
    title: "Students",
    description: "Practical training that leads to real projects and internships.",
    href: "/training",
    linkLabel: "Explore training",
  },
  {
    title: "Businesses",
    description: "Work with developers trained on real-world outcomes, not just theory.",
    href: "/services",
    linkLabel: "See services",
  },
  {
    title: "Mentors",
    description: "Teach, guide cohorts, and help shape how the next developers learn.",
    href: "/mentors",
    linkLabel: "Become a mentor",
  },
] as const;

/**
 * Deliberately the quietest section on the page - plain text and links, no
 * Card, no icons, zero motion beyond a text underline on hover. The absence
 * of visual weight is what keeps this "epilogue" content rather than a
 * second competing offer (see Phase E's Home revision for the full
 * reasoning). Placed after the CTA band in src/app/page.tsx, never before it.
 */
function WhoWeHelp() {
  return (
    <Section background="muted">
      <Container className="flex flex-col gap-10">
        <h2 className="font-display text-foreground text-center text-2xl font-semibold tracking-[-0.015em] sm:text-left">
          Who we help
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <div key={audience.title} className="flex flex-col gap-2 text-center sm:text-left">
              <h3 className="text-foreground text-base font-medium">{audience.title}</h3>
              <p className="text-muted-foreground text-sm">{audience.description}</p>
              <Link
                href={audience.href}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                {audience.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhoWeHelp };
