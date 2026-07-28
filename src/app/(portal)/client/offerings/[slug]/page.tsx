import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getOfferingBySlug, getRelatedOfferings } from "@/features/offerings/server/queries";
import { OfferingHero } from "@/features/offerings/components/offering-hero";
import { OfferingOverview } from "@/features/offerings/components/offering-overview";
import { OfferingListSection } from "@/features/offerings/components/offering-list-section";
import { OfferingPricingCard } from "@/features/offerings/components/offering-pricing-card";
import { OfferingTestimonialsPlaceholder } from "@/features/offerings/components/offering-testimonials-placeholder";
import { RelatedOfferings } from "@/features/offerings/components/related-offerings";
import { parseOfferingFaqs } from "@/features/offerings/lib/faq";
import { getPrimaryOfferingCtaAction } from "@/features/offerings/lib/purchase-cta";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { FAQSection } from "@/components/sections/faq-section";
import { CTASection } from "@/components/sections/cta-section";

interface ClientOfferingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ClientOfferingDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offering = await getOfferingBySlug(slug);
  return { title: offering?.title ?? "Offering not found" };
}

/**
 * The in-portal twin of /(marketing)/offerings/[slug] - identical content
 * components, rendered inside the portal shell instead of the marketing
 * layout so a client reading offering details never leaves the app.
 * STUDENT-only offerings 404 here (this catalog is business-scoped, see
 * /client/offerings). CTAs still resolve to the real top-level flows
 * (/checkout, /enroll, /request-proposal) - those already work regardless
 * of which page linked into them.
 */
export default async function ClientOfferingDetailPage({ params }: ClientOfferingDetailPageProps) {
  await requireRole("CLIENT");
  const { slug } = await params;

  const offering = await getOfferingBySlug(slug);
  if (!offering || offering.audience === "STUDENT") {
    notFound();
  }

  const related = await getRelatedOfferings(offering);
  const faqs = parseOfferingFaqs(offering.faqs);
  const primaryCta = getPrimaryOfferingCtaAction(offering);

  return (
    <>
      <SetPageTitle title={offering.title} />
      <OfferingHero offering={offering} />
      <OfferingOverview offering={offering} />
      <OfferingListSection title="What you'll get" items={offering.whatYoullLearn} background="muted" />
      <OfferingListSection title="Benefits" items={offering.benefits} background="default" />
      <OfferingListSection title="Who it's for" items={offering.whoItsFor} background="muted" />
      <OfferingListSection title="Requirements" items={offering.requirements} background="default" />
      <OfferingPricingCard offering={offering} />
      {faqs.length > 0 && <FAQSection items={faqs} />}
      <OfferingTestimonialsPlaceholder />
      <RelatedOfferings offerings={related} hrefBase="/client/offerings" />

      {primaryCta && (
        <CTASection
          heading="Ready to get started?"
          description={
            primaryCta.kind === "buy"
              ? `Get started with ${offering.title} today.`
              : `Reach out about ${offering.title} and we'll take it from there.`
          }
          actionLabel={primaryCta.label}
          actionHref={primaryCta.href}
          inverted
        />
      )}
    </>
  );
}
