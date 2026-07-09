import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Text wordmark, not an image - there's no logo asset yet. Swap the JSX
 * below for an <Image>/SVG mark whenever one exists; every place that
 * renders <Logo /> updates automatically.
 */
function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-foreground text-lg font-semibold tracking-tight transition-opacity hover:opacity-80",
        className
      )}
    >
      Stively
    </Link>
  );
}

export { Logo };
