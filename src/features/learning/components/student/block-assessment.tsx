import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getSubmissionForAssessment } from "../../server/queries";
import { AssessmentSubmissionForm } from "./assessment-submission-form";
import type { Assessment } from "@prisma/client";

/** QUIZ/ASSIGNMENT/PROJECT blocks all render through this - async Server Component so the existing submission (if any) loads without a client-side fetch. */
async function BlockAssessment({ assessment, enrollmentId }: { assessment: Assessment; enrollmentId: string }) {
  const submission = await getSubmissionForAssessment(assessment.id, enrollmentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assessment.title}</CardTitle>
        {assessment.instructions && <CardDescription>{assessment.instructions}</CardDescription>}
      </CardHeader>
      <CardContent>
        <AssessmentSubmissionForm assessment={assessment} enrollmentId={enrollmentId} existingSubmission={submission} />
      </CardContent>
    </Card>
  );
}

export { BlockAssessment };
