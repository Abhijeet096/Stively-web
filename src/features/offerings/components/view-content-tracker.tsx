"use client";

import * as React from "react";

import { trackMetaViewContent } from "@/lib/meta-pixel";

/**
 * Fires Meta Pixel ViewContent once per real page load of an offering
 * detail page - an empty-dependency effect runs exactly once per mount,
 * and a fresh page load is a fresh mount (there's no client-side route
 * transition between offerings that would reuse this component instance).
 * Renders nothing; exists purely for this effect, same reasoning as
 * SaleCountdown being a separate client island rather than making its
 * whole server-rendered parent a client component.
 */
function ViewContentTracker({ contentName, value, currency }: { contentName: string; value?: number; currency?: string }) {
  React.useEffect(() => {
    trackMetaViewContent({ contentName, value, currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount, not on every value/currency identity change
  }, []);

  return null;
}

export { ViewContentTracker };
