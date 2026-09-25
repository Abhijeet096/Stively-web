"use client";

import * as React from "react";
import { Flame } from "lucide-react";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/**
 * Ticks down to a real, server-provided `endsAt` timestamp (Offering.saleEndsAt) -
 * not a per-visit fake countdown. Renders nothing once it passes; the price
 * itself (computed server-side via getOfferingPricing, same source of truth)
 * has already reverted by then, so there's nothing left to claim here.
 *
 * `label` defaults to the pricing-page framing ("Offer price ends in") but
 * is overridable - the pre-enrolled-student banner on the learning overview
 * page (my-learning-view.tsx) reuses this exact ticking logic with "Official
 * launch in" instead, since that's a different true fact about the same
 * deadline, not a second countdown to build.
 */
function SaleCountdown({ endsAt, className, label = "Offer price ends in" }: { endsAt: string; className?: string; label?: string }) {
  const target = React.useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (remaining == null || remaining <= 0) return null;

  return (
    <span className={className}>
      <Flame className="size-3.5 shrink-0" aria-hidden="true" />
      {label} {formatRemaining(remaining)}
    </span>
  );
}

export { SaleCountdown };
