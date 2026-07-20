import Link from "next/link";
import type { Offering } from "@prisma/client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { getOfferingCtaActions, OFFERING_CTA_PRIMARY_VARIANT, OFFERING_CTA_SECONDARY_VARIANT } from "../lib/purchase-cta";

export interface OfferingCTAProps {
  offering: Offering;
  size?: ButtonProps["size"];
  primaryVariant?: ButtonProps["variant"];
  secondaryVariant?: ButtonProps["variant"];
  className?: string;
}

/**
 * Renders whichever CTA(s) getOfferingCtaActions() (../lib/purchase-cta.ts)
 * decides for this offering's purchaseFlow/audience - "Buy now" for
 * DIRECT_PAYMENT, Enroll/Request Proposal for CONSULTATION, or both for
 * BOTH. The first action gets `primaryVariant`, every action after it gets
 * `secondaryVariant` - callers on an ink background (the hero) pass
 * `primaryVariant="inverse" secondaryVariant="outline-inverse"` the same
 * way they always have, just no longer keyed to "student vs business."
 */
function OfferingCTA({
  offering,
  size = "lg",
  primaryVariant = OFFERING_CTA_PRIMARY_VARIANT,
  secondaryVariant = OFFERING_CTA_SECONDARY_VARIANT,
  className,
}: OfferingCTAProps) {
  const actions = getOfferingCtaActions(offering);

  return (
    <div className={className ?? "flex flex-wrap gap-3"}>
      {actions.map((action, index) => (
        <Button key={action.href} size={size} variant={index === 0 ? primaryVariant : secondaryVariant} asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ))}
    </div>
  );
}

export { OfferingCTA };
