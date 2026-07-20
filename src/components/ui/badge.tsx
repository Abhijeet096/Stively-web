import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap gap-1",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
        // Legible on the --ink surface (Hero eyebrow chips, ink cards) where
        // the light-mode `default`/`outline` variants would go invisible.
        ink: "border border-ink-border-strong bg-white/[0.06] text-ink-foreground",
        // The signal-path brand gradient as a solid fill - reserved for the
        // single "Recommended" moment on the pricing page (see pricing-
        // tiers.tsx), never a default choice for ordinary tags.
        gradient: "from-primary via-brand-iris to-brand-teal bg-linear-to-r text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
