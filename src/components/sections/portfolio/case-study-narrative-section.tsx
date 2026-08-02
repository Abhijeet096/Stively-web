import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";

/** Shared shape behind the case-study's Challenge and Solution sections - same layout, different content, so one component instead of two near-duplicates. Only rendered by the caller when the field is actually present. */
function CaseStudyNarrativeSection({ eyebrow, heading, body }: { eyebrow: string; heading: string; body: string }) {
  return (
    <Container size="narrow" className="flex flex-col gap-3">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">{heading}</h2>
      <p className="text-muted-foreground text-lg text-pretty whitespace-pre-line">{body}</p>
    </Container>
  );
}

export { CaseStudyNarrativeSection };
