import { GraduationCap, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";
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
      <Container className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>Audiences</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Who we serve
          </h2>
        </div>
        <div className="grid w-full gap-6 sm:grid-cols-2">
          {AUDIENCES.map((audience, index) => (
            <Reveal key={audience.title} delay={index * 80} className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <span className="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-2xl">
                    <audience.icon className="size-6" aria-hidden="true" />
                  </span>
                  <CardTitle className="font-display">{audience.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {audience.points.map((point) => (
                      <li key={point} className="text-muted-foreground text-sm text-pretty">
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhoWeServe };
