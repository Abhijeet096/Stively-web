import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("py-20 md:py-28 lg:py-32", {
  variants: {
    background: {
      default: "bg-background",
      muted: "bg-muted",
      inverted: "bg-foreground text-background",
    },
  },
  defaultVariants: {
    background: "default",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

/**
 * Wraps every marketing section. Background is `inverted` at most once per
 * page (see design-system.md §18) - it's a deliberate anchor point, not a
 * default choice.
 */
function Section({ className, background, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ background, className }))}
      {...props}
    />
  );
}

export { Section };
