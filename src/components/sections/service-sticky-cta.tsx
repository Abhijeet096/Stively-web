"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ServiceStickyCtaProps {
  /** The id of the section (usually the Hero) this bar appears once scrolled past. */
  watchId: string;
  label: string;
  ctaLabel: string;
  ctaHref: string;
}

/**
 * Generalized sibling of sticky-enroll-bar.tsx for service landing pages -
 * same IntersectionObserver-driven appearance (not a scrollY magic number)
 * and the same top-on-desktop/bottom-on-mobile anchoring, but pointed at
 * the contact flow instead of a Program enrollment, and driven entirely by
 * props instead of a Program record.
 */
function ServiceStickyCta({ watchId, label, ctaLabel, ctaHref }: ServiceStickyCtaProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      // -72px matches the navbar's h-18 (4.5rem) height - keep in sync with
      // src/components/shared/navbar.tsx.
      rootMargin: "-72px 0px 0px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

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
        <span className="text-foreground truncate text-sm font-medium">{label}</span>
        <Button asChild tabIndex={visible ? 0 : -1} className="shrink-0">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export { ServiceStickyCta };
