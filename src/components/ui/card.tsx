import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg bg-card text-card-foreground flex flex-col gap-6 py-6", {
  variants: {
    variant: {
      default: "border border-border shadow-xs",
      // Uses --surface-elevated (a whisper-subtle tinted near-white/near-black,
      // distinct from flat --card) so "elevated" is a genuinely different
      // surface, not just a bigger shadow on the same flat white.
      elevated: "bg-surface-elevated shadow-sm",
      interactive:
        "border border-border shadow-xs cursor-pointer transition-all duration-300 ease-out " +
        "hover:-translate-y-1.5 hover:shadow-glow hover:border-primary/25",
      // For cards sitting directly on the --ink surface (Process, ink-band
      // CTAs) - elevation via the ink surface ladder + hairline border, not
      // a light-mode shadow recipe (see globals.css's --shadow-ink-card).
      ink: "bg-ink-elevated text-ink-foreground border border-ink-border",
      "ink-interactive":
        "bg-ink-elevated text-ink-foreground border border-ink-border cursor-pointer " +
        "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-ink-elevated-2 hover:border-ink-border-strong",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return <div data-slot="card" className={cn(cardVariants({ variant, className }))} {...props} />;
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-xl leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
