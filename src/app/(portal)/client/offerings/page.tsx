import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import type { OfferingCategory } from "@prisma/client";

import { requireRole } from "@/lib/session";
import { getOfferingsForAudience } from "@/features/offerings/server/queries";
import { OfferingGrid } from "@/features/offerings/components/offering-grid";
import { CATEGORY_LABEL } from "@/features/offerings/lib/labels";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = { title: "Explore Offerings" };

// Business-relevant categories only - Training/Internship/Career Guidance
// are student-audience categories that never appear for a BUSINESS-scoped
// offering, so they'd always render an empty pill here.
const BUSINESS_CATEGORIES: OfferingCategory[] = [
  "WEBSITE_DEVELOPMENT",
  "SOFTWARE_DEVELOPMENT",
  "MOBILE_DEVELOPMENT",
  "AI_SOLUTIONS",
  "DIGITAL_MARKETING",
  "CORPORATE_TRAINING",
  "SAAS",
];

interface ClientOfferingsPageProps {
  searchParams: Promise<{ category?: string }>;
}

/**
 * The in-portal twin of /(marketing)/offerings, scoped to what a client
 * account can actually act on (audience BUSINESS or BOTH) and rendered
 * inside the portal shell so browsing offerings never bounces the client
 * out to the public marketing site.
 */
export default async function ClientOfferingsPage({ searchParams }: ClientOfferingsPageProps) {
  await requireRole("CLIENT");
  const { category: rawCategory } = await searchParams;
  const category = BUSINESS_CATEGORIES.includes(rawCategory as OfferingCategory)
    ? (rawCategory as OfferingCategory)
    : undefined;

  const offerings = await getOfferingsForAudience("BUSINESS", 100, category);

  return (
    <>
      <SetPageTitle title="Explore Offerings" />
      <Container className="flex flex-col gap-6 py-8">
        <SectionHeader
          title="Explore Offerings"
          description="Software, AI, marketing, and more - browse everything Stively offers for your business."
        />

        <nav aria-label="Browse by category" className="flex flex-wrap gap-2">
          <Link href="/client/offerings">
            <Badge variant={!category ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm">
              All
            </Badge>
          </Link>
          {BUSINESS_CATEGORIES.map((c) => (
            <Link key={c} href={`/client/offerings?category=${c}`}>
              <Badge variant={category === c ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm">
                {CATEGORY_LABEL[c]}
              </Badge>
            </Link>
          ))}
        </nav>

        {offerings.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No offerings match this category"
            description="Try a different category, or browse everything we offer."
            actionLabel="View all offerings"
            actionHref="/client/offerings"
          />
        ) : (
          <OfferingGrid offerings={offerings} hrefBase="/client/offerings" />
        )}
      </Container>
    </>
  );
}
