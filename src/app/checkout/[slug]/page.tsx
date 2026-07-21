import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { CheckoutButton } from "@/features/orders/components/checkout-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

/**
 * Business twin of src/app/enroll/[slug]/page.tsx - same inline auth
 * (callbackUrl, not requireRole's bare redirect) and audience gating, but
 * a single action instead of a wizard: a purchase is one click, not a
 * multi-step application (see prisma/schema.prisma's Order comment on why
 * this is a separate model/flow from OfferingRequest).
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const path = `/checkout/${slug}`;

  const offering = await prisma.offering.findFirst({
    where: { slug, status: "PUBLISHED", visible: true },
  });
  if (!offering) {
    notFound();
  }
  if (offering.purchaseFlow !== "DIRECT_PAYMENT" && offering.purchaseFlow !== "BOTH") {
    notFound();
  }
  if (offering.pricingType === "CUSTOM_QUOTE") {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const role = session.user.role;
  const audienceAllows =
    (offering.audience === "STUDENT" && role === "STUDENT") ||
    (offering.audience === "BUSINESS" && role === "CLIENT") ||
    (offering.audience === "BOTH" && (role === "STUDENT" || role === "CLIENT"));
  if (!audienceAllows) {
    redirect("/unauthorized");
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const isFree = offering.pricingType === "FREE";
  const amount = offering.discountPrice ?? offering.price;
  const priceLabel = isFree ? "Free" : amount != null ? formatPrice(amount, offering.currency) : "-";
  const detailPathPrefix = role === "CLIENT" ? "/client/orders" : "/student/orders";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">{offering.title}</CardTitle>
        <CardDescription>{offering.shortDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between border-t border-border/70 pt-4">
        <span className="text-muted-foreground text-sm">Total</span>
        <span className="text-foreground font-display text-2xl font-semibold tabular-nums">{priceLabel}</span>
      </CardContent>
      <CardFooter className="flex-col items-stretch">
        <CheckoutButton
          offeringId={offering.id}
          offeringTitle={offering.title}
          isFree={isFree}
          priceLabel={priceLabel}
          userName={session.user.name ?? undefined}
          userEmail={session.user.email ?? undefined}
          detailPathPrefix={detailPathPrefix}
          nonce={nonce}
        />
      </CardFooter>
    </Card>
  );
}
