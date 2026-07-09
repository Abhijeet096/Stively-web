import * as React from "react";

import { cn } from "@/lib/utils";

function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12", className)}
      {...props}
    />
  );
}

export { Container };
