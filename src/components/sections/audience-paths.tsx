import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Eyebrow } from "@/components/shared/eyebrow";

/**
 * Replaces EcosystemNote (AD-022) - that section framed training as a
 * one-paragraph footnote explaining "where our developers come from,"
 * subordinate to the business narrative. This is a real, equal-weight
 * second path instead: a business visitor and a training visitor should
 * both find their own entry point here, not one finding a mention of the
 * other. Two cards, not a full duplicate homepage - training gets its own
 * dedicated page (/training) same as services get theirs (/services); this
 * section's job is discoverability, not re-explaining either offer in full.
 */
const PATHS = [
  {
    icon: Briefcase,
    label: "For Businesses",
    description:
      "Custom websites, web applications, and software - built by a trained team with a process you can see, end to end.",
    href: "/services",
    cta: "Explore services",
  },
  {
    icon: GraduationCap,
    label: "For Learners",
    description:
      "Practical, project-based training in software development and AI - the same real-project approach behind every Stively build.",
    href: "/training",
    cta: "Explore training",
  },
] as const;

function AudiencePaths() {
  return (
    <Section background="default">
      <Container className="flex flex-col gap-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          <Eyebrow>Two audiences, one team</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            Build with Stively. Learn with Stively.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PATHS.map((path, index) => (
            <Reveal key={path.label} delay={index * 80}>
              <Link
                href={path.href}
                className="group border-border bg-card hover:border-primary/30 hover:shadow-glow focus-visible:ring-ring flex h-full flex-col gap-4 rounded-xl border p-6 shadow-xs transition-all duration-200 ease-out outline-none hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
              >
                <span className="from-primary/20 to-primary/5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br">
                  <path.icon className="text-primary size-6" aria-hidden="true" />
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="text-foreground text-xl font-semibold">{path.label}</h3>
                  <p className="text-muted-foreground text-sm text-pretty">{path.description}</p>
                </div>
                <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
                  {path.cta}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { AudiencePaths };
