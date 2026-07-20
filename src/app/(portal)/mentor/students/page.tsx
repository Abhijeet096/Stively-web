import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { getMentorByUserId, getMyAssignedStudents } from "@/features/mentors/server/queries";
import { AssignedStudentsList } from "@/features/mentors/components/mentor/assigned-students-list";

export const metadata: Metadata = { title: "My Students" };

export default async function MentorStudentsPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);
  const students = mentor ? await getMyAssignedStudents(mentor.id) : [];

  return (
    <>
      <SetPageTitle title="My Students" />
      <Container className="flex flex-col gap-6 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">My Students</h2>
        <AssignedStudentsList assignments={students} />
      </Container>
    </>
  );
}
