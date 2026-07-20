import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";

export interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface WhyChooseStivelyProps {
  heading?: string;
  reasons: Reason[];
}

function WhyChooseStively({ heading = "Why choose Stively", reasons }: WhyChooseStivelyProps) {
  return (
    <Section background="muted">
      <Container className="flex flex-col gap-10 lg:flex-row lg:gap-16">
        <div className="flex flex-col gap-3 lg:w-1/3 lg:shrink-0">
          <Eyebrow>Why Stively</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            {heading}
          </h2>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-2">
          {reasons.map((reason, index) => (
            <Reveal key={reason.title} delay={index * 60} className="flex gap-4">
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <reason.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-semibold">{reason.title}</h3>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhyChooseStively };
