import type { User, OfferingEnrollment, Offering } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentorAvatar } from "../shared/mentor-avatar";
import { ExpertiseTags } from "../shared/expertise-tags";
import { SessionList, type SessionListItem } from "../shared/session-list";
import { MENTOR_TYPE_LABEL } from "../../lib/mentor-types";
import { MentorAssignmentStatusBadge } from "../shared/mentor-assignment-status-badge";
import { MentorActiveToggle } from "./mentor-active-toggle";
import { AssignStudentForm } from "./assign-student-form";
import { EndAssignmentButton } from "./end-assignment-button";
import type { MentorForAdmin } from "../../server/admin-queries";

interface MentorDetailProps {
  mentor: MentorForAdmin;
  assignableStudents: User[];
  enrollmentsByStudent: Record<string, (OfferingEnrollment & { offering: Offering })[]>;
}

function MentorDetail({ mentor, assignableStudents, enrollmentsByStudent }: MentorDetailProps) {
  const sessions: SessionListItem[] = mentor.sessions.map((session) => ({
    id: session.id,
    title: session.title,
    sessionType: session.sessionType,
    status: session.status,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    meetingUrl: session.meetingUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <MentorAvatar name={mentor.user.name} photoUrl={mentor.profilePhotoUrl} className="size-14" />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-xl">{mentor.user.name}</CardTitle>
                <Badge variant={mentor.isActive ? "success" : "secondary"}>{mentor.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <CardDescription>{mentor.user.email}</CardDescription>
              <Badge variant="outline" className="w-fit">
                {MENTOR_TYPE_LABEL[mentor.type]}
              </Badge>
            </div>
          </div>
          <MentorActiveToggle mentorId={mentor.id} isActive={mentor.isActive} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {mentor.headline && <p className="text-foreground text-sm font-medium">{mentor.headline}</p>}
          {mentor.bio && <p className="text-muted-foreground text-sm whitespace-pre-line">{mentor.bio}</p>}
          {mentor.expertiseAreas.length > 0 && <ExpertiseTags items={mentor.expertiseAreas} />}
          {mentor.affiliatedTeamMember && (
            <p className="text-muted-foreground text-xs">Affiliated staff: {mentor.affiliatedTeamMember.name}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign a student</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignStudentForm mentorId={mentor.id} students={assignableStudents} enrollmentsByStudent={enrollmentsByStudent} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned students ({mentor.assignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {mentor.assignments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No students assigned yet.</p>
          ) : (
            mentor.assignments.map((assignment) => (
              <div key={assignment.id} className="border-border/70 flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">{assignment.student.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {assignment.enrollment?.offering.title ?? "Platform-wide"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MentorAssignmentStatusBadge status={assignment.status} />
                  <EndAssignmentButton assignmentId={assignment.id} mentorId={mentor.id} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionList sessions={sessions} emptyLabel="No sessions scheduled" />
        </CardContent>
      </Card>
    </div>
  );
}

export { MentorDetail };
