"use client";

import * as React from "react";
import Link from "next/link";
import type { Program } from "@prisma/client";

import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Appears once the Hero (id="program-hero") scrolls out of view - watched
 * via IntersectionObserver rather than a scrollY magic number, so it stays
 * correct regardless of hero height. Top-anchored on desktop (just below
 * the navbar), bottom-anchored on mobile (thumb-reachable) - per Phase E's
 * explicit mobile reflow note for this one component.
 */
function StickyEnrollBar({ program }: { program: Program }) {
  const [visible, setVisible] = React.useState(false);
  const enrollHref = `/signup?callbackUrl=/training/${program.slug}`;

  React.useEffect(() => {
    const hero = document.getElementById("program-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      // -72px matches the navbar's h-18 (4.5rem) height set in
      // src/components/shared/navbar.tsx - keep these in sync.
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "border-border bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md",
        "md:top-18 md:bottom-auto md:border-t-0 md:border-b",
        "transition-transform duration-200 ease-out",
        visible ? "translate-y-0" : "translate-y-full md:translate-y-[-100%]"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 md:px-8">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-foreground truncate text-sm font-medium">{program.title}</span>
          <span className="text-muted-foreground text-sm">
            {formatPrice(program.price, program.currency)}
          </span>
        </div>
        <Button asChild tabIndex={visible ? 0 : -1} className="shrink-0">
          <Link href={enrollHref}>Enroll now</Link>
        </Button>
      </div>
    </div>
  );
}

export { StickyEnrollBar };
