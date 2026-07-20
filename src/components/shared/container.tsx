import * as React from "react";

import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "default" (max-w-7xl) for grids/cards; "narrow" (max-w-3xl) for text-forward, reading-width content. */
  size?: "default" | "narrow";
}

function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full px-6 md:px-8 lg:px-12",
        size === "narrow" ? "max-w-3xl" : "max-w-7xl",
        className
      )}
      {...props}
    />
  );
}

export { Container };
