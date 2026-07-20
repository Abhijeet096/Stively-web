import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { getStudentMentors } from "@/features/mentors/server/queries";
import { MyMentorsList } from "@/features/mentors/components/student/my-mentors-list";

export const metadata: Metadata = { title: "My Mentors" };

export default async function StudentMentorsPage() {
  const user = await requireRole("STUDENT");
  const assignments = await getStudentMentors(user.id);

  return (
    <>
      <SetPageTitle title="My Mentors" />
      <Container className="flex flex-col gap-6 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">My Mentors</h2>
        <MyMentorsList assignments={assignments} />
      </Container>
    </>
  );
}
