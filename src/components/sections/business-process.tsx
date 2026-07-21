import { ProcessTimeline, type ProcessStep } from "@/components/sections/process-timeline";

const STEPS: ProcessStep[] = [
  {
    title: "Discovery",
    description:
      "A conversation about what you actually need, before anything is scoped or promised.",
  },
  {
    title: "Proposal",
    description: "A clear plan, timeline, and fixed estimate you approve before work starts.",
  },
  {
    title: "Development",
    description: "Built in visible stages with regular check-ins - not a black box until launch.",
  },
  {
    title: "QA & launch",
    description: "Reviewed and tested against real usage before it reaches your users.",
  },
  {
    title: "Support",
    description: "We stay involved after launch - software needs upkeep, not a one-time handoff.",
  },
];

/**
 * The homepage's "how we work" section - now a thin wrapper around the
 * generalized ProcessTimeline (see process-timeline.tsx), unchanged in
 * every visible respect. Also stands in for a "case study" section: since
 * no real client work existed yet to show honestly when this was written,
 * this answers "what does working with Stively actually look like" through
 * the real process itself instead of a fabricated project story.
 */
function BusinessProcess() {
  return (
    <ProcessTimeline
      id="how-we-work"
      eyebrow="How we work"
      heading="How an engagement actually runs"
      description="Five stages, the same way every time - so you always know what happens next."
      steps={STEPS}
    />
  );
}

export { BusinessProcess };
