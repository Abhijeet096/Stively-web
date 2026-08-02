import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matches CaseStudyHero - meaningful for a slug not yet in generateStaticParams' set, which renders on-demand. */
export default function Loading() {
  return (
    <Section background="default" className="pt-12 pb-0 md:pt-16">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </Container>
    </Section>
  );
}
