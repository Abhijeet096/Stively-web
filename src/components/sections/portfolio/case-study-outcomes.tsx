import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Card, CardContent } from "@/components/ui/card";

interface Outcome {
  label: string;
  value: string;
}

/** Business-outcome stat tiles - only rendered by the caller when `outcomes` is non-empty. Real metrics only, never a placeholder (see PortfolioItem's no-fabrication comment). */
function CaseStudyOutcomes({ outcomes }: { outcomes: Outcome[] }) {
  return (
    <Container className="flex flex-col gap-8">
      <Eyebrow>Business Outcomes</Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {outcomes.map((outcome) => (
          <Card key={outcome.label}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-primary font-display text-3xl font-semibold">{outcome.value}</span>
              <span className="text-muted-foreground text-sm">{outcome.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}

export { CaseStudyOutcomes };
