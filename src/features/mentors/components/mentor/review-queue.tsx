"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/sections/empty-state";
import { gradeSubmission } from "@/features/learning/actions/admin-review-actions";
import type { getSubmissionsForMentorReview } from "../../server/queries";

type Submission = Awaited<ReturnType<typeof getSubmissionsForMentorReview>>[number];

function ReviewQueueItem({ submission }: { submission: Submission }) {
  const router = useRouter();
  const [score, setScore] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [pendingDecision, setPendingDecision] = React.useState<"GRADED" | "REVISION_REQUESTED" | null>(null);
  const [error, setError] = React.useState<string | undefined>();

  async function handleDecision(decision: "GRADED" | "REVISION_REQUESTED") {
    if (!feedback.trim()) {
      setError("Leave feedback for the student first.");
      return;
    }
    setPendingDecision(decision);
    setError(undefined);
    const result = await gradeSubmission(submission.id, {
      decision,
      score: score ? Number(score) : undefined,
      feedback: feedback.trim(),
    });
    setPendingDecision(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{submission.assessment.title}</CardTitle>
        <CardDescription>
          {submission.enrollment.student.name} &middot; {submission.enrollment.offering.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submission.content && (
          <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-line">{submission.content}</p>
        )}
        {submission.fileUrl && (
          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
            View submitted file
          </a>
        )}

        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <FormField id={`score-${submission.id}`} label="Score" optional helpText="Out of 100">
            <Input
              id={`score-${submission.id}`}
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </FormField>
          <FormField id={`feedback-${submission.id}`} label="Feedback">
            <Textarea
              id={`feedback-${submission.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button
            onClick={() => handleDecision("GRADED")}
            loading={pendingDecision === "GRADED"}
            disabled={pendingDecision !== null}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDecision("REVISION_REQUESTED")}
            loading={pendingDecision === "REVISION_REQUESTED"}
            disabled={pendingDecision !== null}
          >
            Request revision
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewQueue({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <EmptyState icon={ClipboardCheck} title="Nothing to review" description="Submissions from your students will appear here." />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {submissions.map((submission) => (
        <ReviewQueueItem key={submission.id} submission={submission} />
      ))}
    </div>
  );
}

export { ReviewQueue };
