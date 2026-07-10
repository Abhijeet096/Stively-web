import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shape-matches the real Program Detail layout (design-system.md §22) -
 * meaningful here specifically because a slug not yet in the static params
 * set triggers on-demand rendering, so this can genuinely be seen, unlike
 * Home's fully pre-rendered page.
 */
export default function Loading() {
  return (
    <Section background="default" className="py-16 md:py-20">
      <Container className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </Container>
    </Section>
  );
}
