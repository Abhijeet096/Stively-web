import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import type { getAllLearningExperiences } from "../../server/admin-queries";

type Experience = Awaited<ReturnType<typeof getAllLearningExperiences>>[number];

function LearningExperienceList({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No curricula yet"
        description="Create one for an offering to start building its curriculum."
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {experiences.map((experience) => (
        <Link key={experience.id} href={`/admin/learning/${experience.id}`}>
          <Card variant="interactive" className="h-full">
            <CardHeader>
              <Badge variant="secondary">{experience.offering.category.replaceAll("_", " ")}</Badge>
              <CardTitle className="font-display">{experience.title ?? experience.offering.title}</CardTitle>
              <CardDescription>{experience.offering.shortDescription}</CardDescription>
            </CardHeader>
            <CardFooter className="text-muted-foreground border-border/70 mt-auto justify-between border-t pt-4 text-sm">
              <span>{experience.moduleCount} modules</span>
              <span>{experience.lessonCount} lessons</span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export { LearningExperienceList };
