import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getAllTeamMembersForMentorAffiliation } from "@/features/mentors/server/admin-queries";
import { MentorForm } from "@/features/mentors/components/admin/mentor-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "New Mentor" };

export default async function NewMentorPage() {
  const teamMembers = await getAllTeamMembersForMentorAffiliation();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/mentors" aria-label="Back to Mentors">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">New Mentor</h1>
      </div>

      <div className="max-w-2xl">
        <MentorForm teamMembers={teamMembers} />
      </div>
    </div>
  );
}
