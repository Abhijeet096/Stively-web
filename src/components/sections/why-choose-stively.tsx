import type { LucideIcon } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

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
      <Container className="flex flex-col gap-10">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="flex gap-4">
              <reason.icon className="text-primary mt-1 size-6 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-semibold">{reason.title}</h3>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { WhyChooseStively };
