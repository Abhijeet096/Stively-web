import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * The post-purchase one-time-offer for Stively Prime Membership - shown on
 * the dashboard rather than as a guest-checkout pre-payment checkbox on
 * purpose (see Offering.grantsPrimeMembership's schema comment): someone
 * who's already bought something and has a real dashboard is a much better
 * moment to ask than one more checkbox competing with the primary purchase
 * decision. Purchasing goes through the normal authenticated /checkout
 * flow unchanged - by the time anyone sees this, they already have an
 * account.
 */
function PrimeMembershipBanner() {
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-foreground font-medium">Get 50% off every course, forever</p>
            <p className="text-muted-foreground text-sm">
              A one-time ₹399 unlocks Stively Prime - half price on everything you take from here on.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/checkout/prime-membership">Become a Prime member</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export { PrimeMembershipBanner };
