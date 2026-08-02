import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";

/** Renders `summary` as the case-study's Overview section - always present, since `summary` is a required field on every PortfolioItem. */
function CaseStudyOverview({ summary, clientName }: { summary: string; clientName: string | null }) {
  return (
    <Container size="narrow" className="flex flex-col gap-3">
      <Eyebrow>Overview</Eyebrow>
      {clientName && <p className="text-muted-foreground text-sm">Built for {clientName}</p>}
      <p className="text-foreground text-lg text-pretty whitespace-pre-line">{summary}</p>
    </Container>
  );
}

export { CaseStudyOverview };
