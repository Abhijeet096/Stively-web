import Image from "next/image";
import Link from "next/link";
import type { Offering } from "@prisma/client";
import { Clock, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * The Digital Store's own product card - deliberately not OfferingCard
 * (which is image-less and reused across every other catalog surface in
 * the app; giving it an image branch just for this one page would change
 * its contract everywhere it's already used). A book/template product
 * lives or dies on its cover, so the image is the first thing here.
 *
 * Renders a real, clickable "Buy" card for a PUBLISHED offering, or an
 * inert "Coming Soon" card for one that isn't purchasable yet - never a
 * link to nowhere.
 */
function DigitalProductCard({ offering }: { offering: Offering }) {
  const isAvailable = offering.status === "PUBLISHED";
  const price = offering.discountPrice ?? offering.price;

  const media = (
    <div className="bg-muted relative aspect-square w-full overflow-hidden">
      {offering.thumbnailUrl && (
        <Image
          src={offering.thumbnailUrl}
          alt={offering.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className={cn("object-cover transition-transform duration-500", isAvailable && "group-hover:scale-[1.03]")}
        />
      )}
      {!isAvailable && <div className="absolute inset-0 bg-white/55" aria-hidden="true" />}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        {isAvailable && offering.featured && <Badge variant="destructive">Bestseller</Badge>}
        {!isAvailable && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" aria-hidden="true" />
            Coming Soon
          </Badge>
        )}
      </div>
    </div>
  );

  const body = (
    <CardContent className="flex flex-1 flex-col gap-3 px-4 pb-4">
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-display text-foreground text-sm leading-snug font-semibold text-balance">{offering.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-xs text-pretty">{offering.shortDescription}</p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {isAvailable && price != null ? (
          <span className="text-foreground font-display text-base font-semibold tabular-nums">
            {formatPrice(price, offering.currency)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs font-medium">Not available yet</span>
        )}

        {isAvailable ? (
          <Button size="sm" tabIndex={-1} aria-hidden="true" className="pointer-events-none">
            <ShoppingCart aria-hidden="true" />
            Buy Now
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Notify Me
          </Button>
        )}
      </div>
    </CardContent>
  );

  if (!isAvailable) {
    return (
      <Card variant="default" className="h-full gap-0 overflow-hidden py-0 opacity-80">
        {media}
        {body}
      </Card>
    );
  }

  return (
    <Link
      href={`/digital-store/${offering.slug}`}
      className="group focus-visible:ring-ring focus-visible:ring-offset-background block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Card variant="interactive" className="h-full gap-0 overflow-hidden py-0">
        {media}
        {body}
      </Card>
    </Link>
  );
}

export { DigitalProductCard };
