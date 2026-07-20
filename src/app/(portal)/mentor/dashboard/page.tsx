import type { Metadata } from "next";
import Link from "next/link";
import { Users, CalendarDays, ClipboardCheck, MessageCircle } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { StatCard } from "@/components/dashboard-shell/widgets/stat-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/sections/empty-state";
import {
  getMentorByUserId,
  getMyAssignedStudents,
  getMentorSessions,
  getSubmissionsForMentorReview,
  getConversationsForMentor,
} from "@/features/mentors/server/queries";
import { AssignedStudentsList } from "@/features/mentors/components/mentor/assigned-students-list";

export const metadata: Metadata = { title: "Mentor Dashboard" };

export default async function MentorDashboardPage() {
  const user = await requireRole("MENTOR");
  const mentor = await getMentorByUserId(user.id);

  if (!mentor) {
    return (
      <>
        <SetPageTitle title="Mentor Dashboard" />
        <Container className="py-8">
          <EmptyState
            icon={Users}
            title="Your mentor profile isn't set up yet"
            description="Contact an admin to finish setting up your mentor profile."
          />
        </Container>
      </>
    );
  }

  const [students, sessions, pendingReviews, conversations] = await Promise.all([
    getMyAssignedStudents(mentor.id),
    getMentorSessions(mentor.id),
    getSubmissionsForMentorReview(mentor.id),
    getConversationsForMentor(mentor.id),
  ]);

  const upcomingSessions = sessions.filter((s) => s.status === "SCHEDULED" && s.scheduledAt > new Date());
  const firstName = user.name?.split(" ")[0];

  return (
    <>
      <SetPageTitle title="Mentor Dashboard" />
      <Container className="flex flex-col gap-10 py-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm">Here&apos;s what your mentees need from you right now.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Students" value={students.length} icon={Users} />
          <StatCard label="Upcoming sessions" value={upcomingSessions.length} icon={CalendarDays} />
          <StatCard label="Pending reviews" value={pendingReviews.length} icon={ClipboardCheck} />
          <StatCard label="Conversations" value={conversations.length} icon={MessageCircle} />
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Your students"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/mentor/students">View all</Link>
              </Button>
            }
          />
          <AssignedStudentsList assignments={students.slice(0, 6)} />
        </section>
      </Container>
    </>
  );
}
