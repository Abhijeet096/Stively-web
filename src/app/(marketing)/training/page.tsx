import type { Metadata } from "next";
import { SearchX } from "lucide-react";

import { B2B_ONLY_MODE } from "@/config/site";
import {
  getPaginatedPrograms,
  isValidProgramLevel,
  isValidProgramMode,
  isValidDurationBucket,
} from "@/lib/queries/programs";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { HeroSection } from "@/components/sections/hero-section";
import { TrainingFilters } from "@/components/sections/training-filters";
import { TrainingPagination } from "@/components/sections/training-pagination";
import { ProgramCard } from "@/components/sections/program-card";
import { EmptyState } from "@/components/sections/empty-state";
import { CTASection } from "@/components/sections/cta-section";

interface TrainingPageProps {
  searchParams: Promise<{
    q?: string;
    level?: string;
    mode?: string;
    duration?: string;
    page?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Training Programs",
    description:
      "Browse Stively's training programs by level, mode, and duration - practical, cohort-based training built around real outcomes.",
    // Every filter/search/page combination canonicalizes back to the bare
    // URL, per Phase D §9's explicit rule against indexing thin,
    // near-duplicate filtered pages.
    alternates: { canonical: "/training" },
    // B2B_ONLY_MODE (see site.ts): not actively running programs right now
    // - the page stays reachable (a direct/bookmarked visitor sees real,
    // accurate content, not a 404), just excluded from search results for
    // as long as that's true, same "noindex" discipline this codebase
    // already applies to unfinished/step-in-a-flow pages.
    ...(B2B_ONLY_MODE && { robots: { index: false, follow: true } }),
  };
}

/**
 * Reading `searchParams` makes this route dynamically rendered by default
 * (no generateStaticParams here, unlike Program Detail - a filtered,
 * paginated listing can't be meaningfully pre-rendered per URL combination).
 */
export default async function TrainingListingPage({ searchParams }: TrainingPageProps) {
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const level = isValidProgramLevel(params.level) ? params.level : undefined;
  const mode = isValidProgramMode(params.mode) ? params.mode : undefined;
  const duration = isValidDurationBucket(params.duration) ? params.duration : undefined;
  const page = params.page ? Number(params.page) : 1;

  const { programs, totalCount, totalPages } = await getPaginatedPrograms({
    search,
    level,
    mode,
    duration,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  const hasActiveFilters = !!(search || level || mode || duration);

  return (
    <>
      <HeroSection
        eyebrow="Training"
        heading="Find the program that fits where you are"
        subheading="Practical, cohort-based programs built around real outcomes - filter by level, mode, and duration to find the right fit."
        primaryCta={{ label: "Talk to an advisor", href: "/contact" }}
      />

      <Section background="default">
        <Container className="flex flex-col gap-10">
          <TrainingFilters
            search={params.q}
            level={params.level}
            mode={params.mode}
            duration={params.duration}
          />

          {/* Announces result count to screen readers on every filter/page change */}
          <p aria-live="polite" className="sr-only">
            {totalCount} program{totalCount === 1 ? "" : "s"} found
          </p>

          {programs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No programs match these filters"
              description={
                hasActiveFilters
                  ? "Try adjusting or clearing your filters to see more programs."
                  : "There are no published programs right now - check back soon."
              }
              {...(hasActiveFilters
                ? { actionLabel: "Clear filters", actionHref: "/training" }
                : {})}
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
              <TrainingPagination page={page} totalPages={totalPages} searchParams={params} />
            </>
          )}
        </Container>
      </Section>

      <CTASection
        heading="Not sure which program is right for you?"
        description="Talk to an advisor and we'll help you find the best fit - no pressure, no obligation."
        actionLabel="Talk to an advisor"
        actionHref="/contact"
        inverted
      />
    </>
  );
}
