import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Full pill (Framer/Figma/Stripe/Apple's shared CTA grammar) instead of
  // the previous rounded-md rectangle - one of the highest-leverage single
  // changes for reading as a premium agency rather than a default SaaS
  // template. A small -translate-y lift on hover (not scale-up) is the
  // "quiet, premium" micro-interaction the reference brands share.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium " +
    "transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none active:scale-[0.98] active:translate-y-0 " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // Inset top highlight layered under the resting shadow - a thin sliver
        // of light along the top edge, the detail that makes a solid-color
        // button read as a lit, dimensional object instead of a flat rectangle.
        primary:
          "bg-primary text-primary-foreground shadow-button hover:-translate-y-0.5 hover:brightness-105 hover:shadow-glow active:brightness-95",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80",
        outline:
          "border border-border bg-background hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button hover:brightness-95 active:brightness-90",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
        // For the ink surfaces (Hero, Process, closing CTA, Footer): a solid
        // near-white pill, the same "the brightest thing on a dark canvas is
        // the primary action" grammar Raycast/Framer use, instead of the
        // brand indigo (which reads muddier against --ink than white does).
        inverse:
          "bg-ink-foreground text-ink shadow-button hover:-translate-y-0.5 hover:brightness-95 active:brightness-90",
        // Secondary action on ink surfaces - a translucent outline rather
        // than a filled surface, so it recedes under `inverse`/`primary`.
        "outline-inverse":
          "border border-ink-border-strong bg-transparent text-ink-foreground hover:-translate-y-0.5 hover:bg-white/[0.06]",
      },
      size: {
        sm: "h-8 px-3.5 text-xs [&_svg]:size-3.5",
        default: "h-10 px-5 [&_svg]:size-4",
        lg: "h-12 px-7 text-base [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Renders the child element directly instead of a <button>, inheriting all button styles - e.g. <Button asChild><Link href="/x">Go</Link></Button> */
  asChild?: boolean;
  /** Shows a spinner in place of the label and disables interaction, without changing the button's width */
  loading?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
