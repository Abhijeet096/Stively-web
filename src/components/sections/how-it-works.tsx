import { cn } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Reveal } from "@/components/shared/reveal";

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface HowItWorksProps {
  id?: string;
  heading?: string;
  steps: HowItWorksStep[];
}

/**
 * `id` defaults to "how-it-works" - the value this component always
 * hardcoded before this prop existed - so every existing usage (Home,
 * Services) keeps its current anchor-link behavior unchanged. Added
 * because the About page needs two instances on one page (Student and
 * Business journeys), which would otherwise collide on a duplicate id.
 */
const LG_COLUMNS_CLASS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

function HowItWorks({ id = "how-it-works", heading = "How it works", steps }: HowItWorksProps) {
  return (
    <Section id={id} background="muted">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <Eyebrow>Process</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            {heading}
          </h2>
        </div>
        <ol
          className={cn(
            "grid gap-x-8 gap-y-10 sm:grid-cols-2",
            LG_COLUMNS_CLASS[steps.length] ?? "lg:grid-cols-4"
          )}
        >
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 70} className="flex flex-col gap-3">
                <span className="border-primary/25 bg-background text-primary flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-foreground text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm text-pretty">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export { HowItWorks };
