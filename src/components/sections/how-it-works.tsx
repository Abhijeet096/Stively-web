import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface HowItWorksProps {
  heading?: string;
  steps: HowItWorksStep[];
}

function HowItWorks({ heading = "How it works", steps }: HowItWorksProps) {
  return (
    <Section id="how-it-works" background="muted">
      <Container className="flex flex-col gap-10">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className="text-primary text-sm font-medium">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-foreground text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

export { HowItWorks };
