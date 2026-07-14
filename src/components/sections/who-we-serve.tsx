import { GraduationCap, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Audience {
  icon: LucideIcon;
  title: string;
  points: string[];
}

const AUDIENCES: Audience[] = [
  {
    icon: GraduationCap,
    title: "Students",
    points: [
      "Train on real, cohort-based programs - not a self-paced video library",
      "Build a portfolio of actual projects, not classroom exercises",
      "A path from learning into real internship and client work",
    ],
  },
  {
    icon: Building2,
    title: "Businesses",
    points: [
      "Work with developers trained and evaluated before they touch a real project",
      "A transparent process, not a black-box agency engagement",
      "Software delivery without agency-level overhead",
    ],
  },
];

/**
 * Distinct from src/components/sections/who-we-help.tsx, which stays
 * unmodified and still serves Home's specific purpose there (a
 * deliberately quiet, one-line-per-audience epilogue section, per
 * docs/phase-e-visual-ux-planning.md's Home revision). This section is a
 * fuller treatment for a page whose whole purpose is building trust with
 * both audiences, not a re-styling of the same component.
 */
function WhoWeServe() {
  return (
    <Section background="default">
      <Container className="flex flex-col gap-10">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          Who we serve
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <Card key={audience.title}>
              <CardHeader>
                <audience.icon className="text-primary mb-2 size-6" aria-hidden="true" />
                <CardTitle>{audience.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {audience.points.map((point) => (
                    <li key={point} className="text-muted-foreground text-sm">
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhoWeServe };
