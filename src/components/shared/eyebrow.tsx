import { cn } from "@/lib/utils";

export interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** "default" for light/muted sections, "inverse" for the --ink surfaces (Hero/Process/CTA/Footer). */
  tone?: "default" | "inverse";
}

/**
 * The small mono label + hairline rule that opens every section heading
 * site-wide (Vercel/Raycast's "uppercase mono eyebrow" grammar, tuned to
 * Stively's own brand gradient dot instead of a plain color swatch) - one
 * shared component instead of the same three classNames re-typed in nine
 * section files.
 */
function Eyebrow({ children, className, tone = "default" }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.14em] uppercase",
        tone === "default" ? "text-primary" : "text-ink-muted-foreground",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="from-primary via-brand-iris to-brand-teal h-px w-5 bg-linear-to-r"
      />
      {children}
    </span>
  );
}

export { Eyebrow };
