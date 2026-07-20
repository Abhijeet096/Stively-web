"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import type { SubmissionStatus } from "@prisma/client";
import { createNotification } from "@/features/notifications/server/creation";
import { getMentorByUserId } from "@/features/mentors/server/queries";

interface GradeSubmissionInput {
  decision: Extract<SubmissionStatus, "GRADED" | "REVISION_REQUESTED">;
  score?: number;
  feedback: string;
}

/**
 * Phase 9 built this as a prepared-but-unwired hook for "the future
 * mentor-review workflow" - Phase 10 is that workflow, so this is
 * broadened (not forked into a second action) to accept MENTOR callers
 * alongside the original ADMIN/SUPER_ADMIN ones. Reviewer identity
 * resolves to whichever one applies (reviewedById for staff,
 * reviewedByMentorId for a mentor - the same mutually-exclusive nullable
 * FK pattern used throughout this schema). A mentor can only grade
 * submissions from their own actively-assigned students; admins are
 * unrestricted, same as before.
 */
export async function gradeSubmission(submissionId: string, input: GradeSubmissionInput): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "MENTOR");

  try {
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id: submissionId },
      include: { enrollment: true },
    });
    if (!submission) return { success: false, error: "Not found" };

    let reviewedById: string | undefined;
    let reviewedByMentorId: string | undefined;

    if (user.role === "MENTOR") {
      const mentor = await getMentorByUserId(user.id);
      if (!mentor) return { success: false, error: "Mentor profile not found." };
      const assignment = await prisma.mentorAssignment.findFirst({
        where: { mentorId: mentor.id, studentId: submission.enrollment.studentId, status: "ACTIVE" },
      });
      if (!assignment) return { success: false, error: "This student isn't assigned to you." };
      reviewedByMentorId = mentor.id;
    } else {
      const teamMember = await prisma.teamMember.findUnique({ where: { userId: user.id } });
      reviewedById = teamMember?.id;
    }

    await prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: input.decision,
        score: input.decision === "GRADED" ? input.score : null,
        feedback: input.feedback,
        reviewedById,
        reviewedByMentorId,
        reviewedAt: new Date(),
      },
    });

    try {
      const block = await prisma.lessonBlock.findFirst({ where: { assessmentId: submission.assessmentId } });
      const link = block
        ? `/student/learning/${submission.enrollmentId}/${block.lessonId}`
        : `/student/learning/${submission.enrollmentId}`;

      await createNotification({
        userId: submission.enrollment.studentId,
        type: "FEEDBACK_RECEIVED",
        title: input.decision === "GRADED" ? "You received feedback" : "A mentor requested a revision",
        body: input.feedback.length > 140 ? `${input.feedback.slice(0, 137)}...` : input.feedback,
        link,
      });
    } catch (error) {
      console.error("gradeSubmission: notification failed:", error);
    }

    revalidatePath("/mentor/reviews");
    return { success: true };
  } catch (error) {
    console.error("gradeSubmission failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
