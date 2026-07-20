import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Text wordmark plus a small signal-gradient mark, not an image - there's
 * no logo asset yet. Swap the JSX below for an <Image>/SVG mark whenever
 * one exists; every place that renders <Logo /> updates automatically.
 * `className` overrides text color for the ink surfaces (Footer) - see
 * callers passing `text-ink-foreground`.
 */
function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group text-foreground inline-flex items-center gap-2 transition-opacity hover:opacity-80",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="from-primary via-brand-iris to-brand-teal ring-primary/15 size-2.5 shrink-0 rounded-full bg-linear-to-br ring-4 transition-transform duration-300 group-hover:scale-110"
      />
      <span className="font-display text-lg font-semibold tracking-tight">Stively</span>
    </Link>
  );
}

export { Logo };
