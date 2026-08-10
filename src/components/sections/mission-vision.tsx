import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

/**
 * Mission and Vision paired in one section, not two separate full-width
 * bands - both are deliberately short ("Short, focused" / "Do NOT
 * exaggerate" per the brief), and two mostly-empty bands in a row would
 * read as filler. Still two clearly distinct, identifiable blocks, not
 * merged into one paragraph.
 *
 * B2B-only rewrite (2026-08-10): mission/vision no longer reference the
 * education-to-industry bridge. Both statements are now scoped to what
 * this page can honestly claim about client work today - a trained,
 * evaluated team and a senior-reviewed delivery process - without
 * inventing a formal program name that doesn't exist elsewhere on the site.
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
            Give businesses a software partner they can actually trust - a trained, evaluated team,
            a transparent process, and senior review on every project before it ships.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-primary font-mono text-xs font-semibold tracking-[0.14em] uppercase">
            Our vision
          </h2>
          <p className="font-display text-foreground text-2xl font-semibold tracking-[-0.015em] text-pretty">
            To be the software partner businesses choose over a traditional agency or a freelancer
            gamble - because the work is reliable, the process is visible, and someone senior always
            stands behind it.
          </p>
        </div>
      </Container>
    </Section>
  );
}

export { MissionVision };
