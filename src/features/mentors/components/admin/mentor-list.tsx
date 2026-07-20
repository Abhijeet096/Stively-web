import Link from "next/link";
import { UserRound } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { MentorAvatar } from "../shared/mentor-avatar";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";
import type { getAllMentors } from "../../server/admin-queries";

type Mentor = Awaited<ReturnType<typeof getAllMentors>>[number];

function MentorList({ mentors }: { mentors: Mentor[] }) {
  if (mentors.length === 0) {
    return <EmptyState icon={UserRound} title="No mentors yet" description="Create one to start assigning students." />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {mentors.map((mentor) => (
        <Link key={mentor.id} href={`/admin/mentors/${mentor.id}`}>
          <Card variant="interactive" className="h-full">
            <CardHeader className="flex flex-row items-start gap-3">
              <MentorAvatar name={mentor.user.name} photoUrl={mentor.profilePhotoUrl} />
              <div className="flex flex-col gap-1">
                <CardTitle className="font-display">{mentor.user.name}</CardTitle>
                <CardDescription>{mentor.headline ?? MENTOR_TYPE_LABEL[mentor.type]}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-border/70 text-muted-foreground mt-auto justify-between border-t pt-4 text-sm">
              <Badge variant={mentor.isActive ? "success" : "secondary"}>{mentor.isActive ? "Active" : "Inactive"}</Badge>
              <span>{mentor.activeStudentCount} students</span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export { MentorList };
