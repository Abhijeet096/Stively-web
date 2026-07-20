import type { MentorMessage } from "@prisma/client";
import type { ActionResult } from "@/actions/leads";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConversationPanel } from "../shared/conversation-panel";
import type { getMyAssignedStudents } from "../../server/queries";

type Assignment = Awaited<ReturnType<typeof getMyAssignedStudents>>[number];

interface StudentDetailPanelProps {
  assignment: Assignment;
  messages: MentorMessage[];
  currentUserId: string;
  onSend: (content: string) => Promise<ActionResult>;
}

function StudentDetailPanel({ assignment, messages, currentUserId, onSend }: StudentDetailPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">{assignment.student.name}</CardTitle>
          <CardDescription>{assignment.student.email}</CardDescription>
        </CardHeader>
        {assignment.enrollment && (
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">{assignment.enrollment.offering.title}</span>
              <span className="text-muted-foreground">{assignment.enrollment.progressPercentage}% complete</span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={assignment.enrollment.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${assignment.enrollment.progressPercentage}%` }}
              />
            </div>
            {assignment.enrollment.currentModule && (
              <p className="text-muted-foreground text-xs">Currently on: {assignment.enrollment.currentModule}</p>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-semibold">Messages</h3>
        <ConversationPanel
          currentUserId={currentUserId}
          otherPartyName={assignment.student.name ?? "this student"}
          messages={messages}
          onSend={onSend}
        />
      </div>
    </div>
  );
}

export { StudentDetailPanel };
