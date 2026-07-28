import Link from "next/link";
import type { Offering } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, MODE_LABEL, formatOfferingPrice } from "../lib/labels";

/**
 * The one card every browse surface renders - the public catalog, category
 * pages, related offerings, and both dashboards' "Explore Offerings"
 * sections. Generic across every OfferingCategory by design (badges read
 * off the record, nothing is category-specific), same role ProgramCard
 * plays for Program but not hardcoded to Training.
 */
/** hrefBase lets a portal-embedded catalog (e.g. /client/offerings) point every card at its own detail route instead of the public /offerings catalog - the card markup itself is identical either way. */
function OfferingCard({ offering, hrefBase = "/offerings" }: { offering: Offering; hrefBase?: string }) {
  return (
    <Link
      href={`${hrefBase}/${offering.slug}`}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card variant="interactive" className="h-full">
        <CardHeader>
          <div className="mb-1 flex flex-wrap gap-2">
            {offering.featured && <Badge variant="gradient">Featured</Badge>}
            <Badge variant="secondary">{CATEGORY_LABEL[offering.category]}</Badge>
            <Badge variant="outline">{MODE_LABEL[offering.mode]}</Badge>
          </div>
          <CardTitle className="font-display">{offering.title}</CardTitle>
          <CardDescription>{offering.shortDescription}</CardDescription>
        </CardHeader>
        <CardFooter className="border-border/70 mt-auto justify-between border-t pt-4">
          <span className="text-foreground font-display text-base font-semibold tabular-nums">
            {formatOfferingPrice(offering.price, offering.currency, offering.pricingType, formatPrice)}
          </span>
          {offering.duration && <span className="text-muted-foreground text-sm">{offering.duration}</span>}
        </CardFooter>
      </Card>
    </Link>
  );
}

export { OfferingCard };
