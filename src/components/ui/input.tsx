import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150 ease-out",
        "focus-visible:border-ring focus-visible:ring-ring/30 outline-none focus-visible:ring-2",
        "disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };
