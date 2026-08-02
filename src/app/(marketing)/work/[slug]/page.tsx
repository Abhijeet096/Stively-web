import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { getPortfolioItemBySlug, getAllPublishedPortfolioSlugs } from "@/lib/queries/portfolio";
import { CaseStudyHero } from "@/components/sections/portfolio/case-study-hero";
import { CaseStudyOverview } from "@/components/sections/portfolio/case-study-overview";
import { CaseStudyNarrativeSection } from "@/components/sections/portfolio/case-study-narrative-section";
import { CaseStudyFeatures } from "@/components/sections/portfolio/case-study-features";
import { CaseStudyTechStack } from "@/components/sections/portfolio/case-study-tech-stack";
import { CaseStudyDeviceMockups } from "@/components/sections/portfolio/case-study-device-mockups";
import { CaseStudyGallery } from "@/components/sections/portfolio/case-study-gallery";
import { CaseStudyOutcomes } from "@/components/sections/portfolio/case-study-outcomes";
import { CTASection } from "@/components/sections/cta-section";

interface PortfolioDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Statically generates every published portfolio item at build time,
 * mirroring training/[slug]/page.tsx exactly. A slug published after the
 * last build still renders on-demand (dynamicParams defaults to true) -
 * see the sibling loading.tsx for that gap. Freshness after an admin edit
 * is handled by portfolio-actions.ts's revalidatePath calls, not by
 * force-dynamic rendering.
 */
export async function generateStaticParams() {
  const slugs = await getAllPublishedPortfolioSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PortfolioDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);

  if (!item) {
    return { title: "Project not found" };
  }

  const title = `${item.title} - Case Study`;
  const description = item.tagline ?? item.summary;

  return {
    title,
    description,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/work/${slug}`,
      images: [item.imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      images: [item.imageUrl],
      title,
      description,
    },
  };
}

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  const { slug } = await params;
  const item = await getPortfolioItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const features = (item.features as { title: string; description: string }[] | null) ?? [];
  const outcomes = (item.outcomes as { label: string; value: string }[] | null) ?? [];

  return (
    <div className="flex flex-col gap-16 pb-16 md:gap-20">
      <CaseStudyHero item={item} />
      <CaseStudyOverview summary={item.summary} clientName={item.clientName} />

      {item.challenge && (
        <CaseStudyNarrativeSection eyebrow="The Challenge" heading="Business challenge" body={item.challenge} />
      )}
      {item.solution && (
        <CaseStudyNarrativeSection eyebrow="Our Approach" heading="Proposed solution" body={item.solution} />
      )}
      {features.length > 0 && <CaseStudyFeatures features={features} />}
      {item.techStack.length > 0 && <CaseStudyTechStack techStack={item.techStack} />}
      {item.mockupImages.length > 0 && (
        <CaseStudyDeviceMockups mockupImages={item.mockupImages} title={item.title} />
      )}
      {item.galleryImages.length > 0 && (
        <CaseStudyGallery galleryImages={item.galleryImages} title={item.title} />
      )}
      {outcomes.length > 0 && <CaseStudyOutcomes outcomes={outcomes} />}

      <CTASection
        heading="Have a project in mind?"
        description="Tell us what you're building and we'll get back to you the same day."
        actionLabel="Start your project"
        actionHref="/start-project"
        inverted
        glow
      />
    </div>
  );
}
