import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("py-20 md:py-28 lg:py-32", {
  variants: {
    background: {
      default: "bg-background",
      muted: "bg-muted",
      // The bookend-dark surface (Hero, Process, closing CTA, Footer) - a
      // fixed near-black indigo "ink" canvas, not the old bg-foreground/
      // text-background flip. See globals.css's --ink token block for why.
      inverted: "bg-ink text-ink-foreground",
    },
  },
  defaultVariants: {
    background: "default",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  /** React 19 supports `ref` as a plain prop on function components - no forwardRef needed. Used by HeroSection/BusinessProcess to hook their animejs timelines to the root DOM node. */
  ref?: React.Ref<HTMLElement>;
}

/**
 * Wraps every marketing section. Background is `inverted` at most once per
 * page (see design-system.md §18) - it's a deliberate anchor point, not a
 * default choice.
 */
function Section({ className, background, ref, ...props }: SectionProps) {
  return (
    <section
      ref={ref}
      data-slot="section"
      className={cn(sectionVariants({ background, className }))}
      {...props}
    />
  );
}

export { Section };
