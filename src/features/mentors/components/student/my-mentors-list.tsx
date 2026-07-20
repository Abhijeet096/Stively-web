import Link from "next/link";
import { Users } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/empty-state";
import { MentorAvatar } from "../shared/mentor-avatar";
import { ExpertiseTags } from "../shared/expertise-tags";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";
import type { getStudentMentors } from "../../server/queries";

type Assignment = Awaited<ReturnType<typeof getStudentMentors>>[number];

function MyMentorsList({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No mentor assigned yet"
        description="Once a mentor is assigned to you, they'll show up here."
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {assignments.map((assignment) => (
        <Link key={assignment.id} href={`/student/mentors/${assignment.mentorId}`}>
          <Card variant="interactive" className="h-full">
            <CardHeader className="flex flex-row items-start gap-3">
              <MentorAvatar name={assignment.mentor.user.name} photoUrl={assignment.mentor.profilePhotoUrl} />
              <div className="flex flex-col gap-1">
                <CardTitle className="font-display">{assignment.mentor.user.name}</CardTitle>
                <CardDescription>{assignment.mentor.headline ?? MENTOR_TYPE_LABEL[assignment.mentor.type]}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-border/70 mt-auto border-t pt-4">
              <ExpertiseTags items={assignment.mentor.expertiseAreas.slice(0, 3)} />
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export { MyMentorsList };
