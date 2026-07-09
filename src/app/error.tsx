"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for real error monitoring (e.g. Sentry) when that's added.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md">
        That&apos;s on us, not you. Try again, and if it keeps happening, reach out at{" "}
        <a href="mailto:hello@stively.com" className="text-primary underline underline-offset-4">
          hello@stively.com
        </a>
        .
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
