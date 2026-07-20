import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

/**
 * Mission and Vision paired in one section, not two separate full-width
 * bands - both are deliberately short ("Short, focused" / "Do NOT
 * exaggerate" per the brief), and two mostly-empty bands in a row would
 * read as filler. Still two clearly distinct, identifiable blocks, not
 * merged into one paragraph.
 *
 * Mission text is sourced close to verbatim from
 * docs/core/stively-core-blueprint-v1.md §1. Vision carries that
 * document's substance (bridging education and industry) without its
 * "Talent Operating System" phrase - that document explicitly marks
 * itself a working title, not confirmed public brand language.
 */
function MissionVision() {
  return (
    <Section background="muted">
      <Container className="grid gap-12 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-primary font-mono text-xs font-semibold tracking-[0.14em] uppercase">
            Our mission
          </h2>
          <p className="font-display text-foreground text-2xl font-semibold tracking-[-0.015em] text-pretty">
            Build a trusted ecosystem where students become industry-ready through real projects,
            and businesses get high-quality software from talent that&apos;s already proven itself.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-primary font-mono text-xs font-semibold tracking-[0.14em] uppercase">
            Our vision
          </h2>
          <p className="font-display text-foreground text-2xl font-semibold tracking-[-0.015em] text-pretty">
            A real bridge between education and industry - not a course library on one side and a
            hiring pipeline on the other, but one connected path from learning to real work.
          </p>
        </div>
      </Container>
    </Section>
  );
}

export { MissionVision };
