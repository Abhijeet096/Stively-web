import type { Offering } from "@prisma/client";

import { formatPrice } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";
import { MODE_LABEL, PRICING_TYPE_LABEL, formatOfferingPrice } from "../lib/labels";
import { OfferingCTA } from "./offering-cta";

/** Generic version of program-pricing-recap.tsx - built only from fields that actually exist on Offering, audience-aware CTA instead of a hardcoded "Enroll now". */
function OfferingPricingCard({ offering }: { offering: Offering }) {
  const details = [
    offering.duration ? { label: "Duration", value: offering.duration } : null,
    { label: "Mode", value: MODE_LABEL[offering.mode] },
    { label: "Pricing", value: PRICING_TYPE_LABEL[offering.pricingType] },
    offering.capacity ? { label: "Capacity", value: `${offering.capacity} seats` } : null,
  ].filter((detail): detail is { label: string; value: string } => detail !== null);

  return (
    <Section background="default">
      <Container className="flex justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <span className="text-foreground font-display text-3xl font-semibold tabular-nums">
              {formatOfferingPrice(offering.price, offering.currency, offering.pricingType, formatPrice)}
            </span>
            {offering.discountPrice != null && offering.price != null && (
              <span className="text-muted-foreground text-sm line-through">
                {formatPrice(offering.price, offering.currency)}
              </span>
            )}
            <dl className="grid w-full grid-cols-2 gap-4 text-sm">
              {details.map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{detail.label}</dt>
                  <dd className="text-foreground font-medium">{detail.value}</dd>
                </div>
              ))}
            </dl>
            <OfferingCTA
              offering={offering}
              className="flex w-full flex-col gap-3 [&_[data-slot=button]]:w-full"
            />
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}

export { OfferingPricingCard };
