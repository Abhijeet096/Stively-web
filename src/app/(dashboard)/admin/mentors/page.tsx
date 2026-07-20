import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getAllMentors } from "@/features/mentors/server/admin-queries";
import { MentorList } from "@/features/mentors/components/admin/mentor-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mentors" };

export default async function AdminMentorsPage() {
  const mentors = await getAllMentors();

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Mentors</h1>
        <Button asChild>
          <Link href="/admin/mentors/new">
            <Plus className="size-4" aria-hidden="true" />
            New mentor
          </Link>
        </Button>
      </div>

      <MentorList mentors={mentors} />
    </div>
  );
}
