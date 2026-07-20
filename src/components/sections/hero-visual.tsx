import { Check, Loader2 } from "lucide-react";

const STAGES = [
  { label: "Discovery", done: true },
  { label: "Proposal", done: true },
  { label: "Development", done: false, active: true },
  { label: "QA & launch", done: false },
] as const;

/**
 * The hero's visual anchor - not a stock photo, not a fabricated product
 * screenshot (Stively isn't a SaaS product, so there's nothing real to
 * screenshot). Built entirely from our own Card-language tokens: a stylized
 * project-status card showing the real 5-stage process from
 * business-process.tsx (same labels, same order), plus a smaller floating
 * tech-stack chip - both honest, verifiable content, not invented metrics
 * or a fake client name. Hidden below `lg` - on small screens the text
 * column carries the hero alone, which is the right priority order on a
 * narrow viewport, not a responsiveness gap.
 */
function HeroVisual() {
  return (
    <div className="relative hidden lg:block lg:h-[420px]">
      {/* Small floating chip, upper-right, opposite rotation to the main card
          for tension - teal glow (the secondary brand color) rather than
          indigo, so the visual carries both brand tokens, not just one. */}
      <div
        className="border-brand-teal/30 bg-card absolute top-2 right-4 z-0 flex -rotate-3 items-center gap-2 rounded-lg border px-4 py-3 shadow-lg"
        style={{ boxShadow: "var(--shadow-card-lit), var(--shadow-glow-teal)" }}
      >
        <span className="bg-success size-2 rounded-full" aria-hidden="true" />
        <span className="text-foreground text-sm font-medium">Trained &amp; evaluated first</span>
      </div>

      {/* Main card - overlaps its own container's bottom edge (negative margin,
          relative positioning) so it visually bleeds into the section below,
          the "break the section boundary" depth technique. */}
      <div
        className="border-border bg-card absolute top-16 left-0 z-10 w-[320px] rotate-2 rounded-xl border p-5 shadow-lg"
        style={{ boxShadow: "var(--shadow-card-lit), var(--shadow-glow)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-foreground text-sm font-semibold">Project status</span>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            On track
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {STAGES.map((stage) => (
            <li key={stage.label} className="flex items-center gap-3">
              <span
                className={
                  "flex size-5 shrink-0 items-center justify-center rounded-full " +
                  (stage.done
                    ? "bg-primary text-primary-foreground"
                    : "active" in stage && stage.active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                {stage.done ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : "active" in stage && stage.active ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                ) : null}
              </span>
              <span
                className={
                  stage.done
                    ? "text-muted-foreground text-sm line-through"
                    : "text-foreground text-sm font-medium"
                }
              >
                {stage.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom accent chip, overlapping the main card's lower-right corner
          and bleeding past this whole visual's own bottom edge into the
          section below. */}
      <div
        className="border-primary/30 bg-card absolute top-[19rem] left-16 z-20 flex -rotate-2 items-center gap-2 rounded-lg border-2 px-4 py-2.5 shadow-lg"
        style={{ boxShadow: "var(--shadow-card-lit), var(--shadow-glow)" }}
      >
        <span className="text-foreground font-mono text-xs">Next.js · TypeScript · Postgres</span>
      </div>
    </div>
  );
}

export { HeroVisual };
