"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitAssessment } from "../../actions/submission-actions";
import type { Assessment, AssessmentSubmission } from "@prisma/client";

interface QuizQuestion {
  question: string;
  options: string[];
}

/** Renders differently per Assessment.type - a quiz picker for QUIZ, a text/file submission form for ASSIGNMENT/PROJECT. Shares one submitAssessment action regardless (see AssessmentSubmission's schema comment on why this is one system, not three). */
function AssessmentSubmissionForm({
  assessment,
  enrollmentId,
  existingSubmission,
}: {
  assessment: Assessment;
  enrollmentId: string;
  existingSubmission: AssessmentSubmission | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [content, setContent] = React.useState(existingSubmission?.content ?? "");
  const [fileUrl, setFileUrl] = React.useState(existingSubmission?.fileUrl ?? "");
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  // A failed QUIZ can be retried (setting this bypasses the graded-result
  // view below and re-shows the question form) - a passed one can't, and
  // ASSIGNMENT/PROJECT submissions never retry from here since a mentor
  // owns that review, not the student.
  const [retrying, setRetrying] = React.useState(false);

  const isQuiz = assessment.type === "QUIZ";
  const passingScore = assessment.passingScore ?? 0;
  const passed = isQuiz && (existingSubmission?.score ?? 0) >= passingScore;

  if (existingSubmission && existingSubmission.status !== "NOT_STARTED" && !(isQuiz && !passed && retrying)) {
    if (isQuiz) {
      return (
        <div className="flex flex-col gap-3 text-sm">
          <span className={"font-medium " + (passed ? "text-success" : "text-destructive")}>
            {passed ? "Passed" : "Not passed yet"} - {existingSubmission.score ?? 0}% (need {passingScore}%)
          </span>
          {!passed && (
            <Button type="button" variant="outline" size="sm" onClick={() => setRetrying(true)} className="self-start">
              Try again
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-foreground font-medium">
          {existingSubmission.status === "GRADED" ? `Graded - ${existingSubmission.score ?? 0}%` : "Submitted"}
        </span>
        {existingSubmission.feedback && <p className="text-muted-foreground">{existingSubmission.feedback}</p>}
      </div>
    );
  }

  const config = (assessment.config as { questions?: QuizQuestion[] } | null) ?? {};
  const questions = config.questions ?? [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);
    const result = await submitAssessment(assessment.id, enrollmentId, {
      answers: assessment.type === "QUIZ" ? answers : undefined,
      content: assessment.type !== "QUIZ" ? content : undefined,
      fileUrl: assessment.type !== "QUIZ" ? fileUrl || undefined : undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (assessment.type === "QUIZ") {
    if (questions.length === 0) {
      return <p className="text-muted-foreground text-sm">This quiz isn&apos;t ready yet - check back soon.</p>;
    }
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {questions.map((q, qIndex) => (
          <fieldset key={qIndex} className="flex flex-col gap-2">
            <legend className="text-foreground text-sm font-medium">{q.question}</legend>
            {q.options.map((option, oIndex) => (
              <label key={oIndex} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`q-${qIndex}`}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                  className="accent-primary"
                />
                {option}
              </label>
            ))}
          </fieldset>
        ))}
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" loading={isPending} className="self-start">
          Submit quiz
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submission-content">Your submission</Label>
        <Textarea
          id="submission-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          placeholder="Describe your work, or paste a summary..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submission-file">Link to your work (optional)</Label>
        <Input
          id="submission-file"
          type="url"
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          placeholder="https://..."
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" loading={isPending} disabled={!content.trim() && !fileUrl.trim()} className="self-start">
        Submit
      </Button>
    </form>
  );
}

export { AssessmentSubmissionForm };
