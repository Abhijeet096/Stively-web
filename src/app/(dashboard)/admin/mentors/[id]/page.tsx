import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { OfferingEnrollment, Offering } from "@prisma/client";
import {
  getMentorForAdmin,
  getAssignableStudents,
  getStudentEnrollmentsForAssignment,
} from "@/features/mentors/server/admin-queries";
import { MentorDetail } from "@/features/mentors/components/admin/mentor-detail";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mentor = await getMentorForAdmin(id);
  return { title: mentor?.user.name ?? "Mentor" };
}

export default async function AdminMentorDetailPage({ params }: PageProps) {
  const { id } = await params;

  const mentor = await getMentorForAdmin(id);
  if (!mentor) notFound();

  const assignableStudents = await getAssignableStudents(id);
  const enrollmentLists = await Promise.all(
    assignableStudents.map((student) => getStudentEnrollmentsForAssignment(student.id))
  );
  const enrollmentsByStudent: Record<string, (OfferingEnrollment & { offering: Offering })[]> = {};
  assignableStudents.forEach((student, index) => {
    enrollmentsByStudent[student.id] = enrollmentLists[index];
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/mentors" aria-label="Back to Mentors">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{mentor.user.name}</h1>
      </div>

      <MentorDetail mentor={mentor} assignableStudents={assignableStudents} enrollmentsByStudent={enrollmentsByStudent} />
    </div>
  );
}
