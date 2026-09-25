import "server-only";

import { Prisma } from "@prisma/client";
import type { Certificate } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { nextDocumentNumber } from "@/features/documents/server/numbering";
import { getCertificateEligibility } from "./eligibility";
import { sendCertificateIssuedEmail } from "./email";

export type IssueCertificateResult =
  | { success: true; certificate: Certificate; alreadyExisted: boolean }
  | { success: false; error: string };

/**
 * The certificate's real stats row (modules/duration/quizzes) - counted
 * from the actual built Module/Lesson/LessonBlock rows the recipient
 * worked through, never the offering's full planned syllabus (curriculum
 * JSON), so a course that's only 4-of-8 modules built shows 4, not a
 * number the recipient never actually completed.
 */
async function computeCertificateStats(offeringId: string): Promise<{
  modulesCompleted: number;
  courseDurationMinutes: number;
  quizzesPassed: number;
}> {
  const experience = await prisma.learningExperience.findUnique({
    where: { offeringId },
    include: { modules: { include: { lessons: { include: { blocks: { select: { type: true } } } } } } },
  });
  const builtModules = experience?.modules.filter((m) => m.lessons.length > 0) ?? [];
  const lessons = builtModules.flatMap((m) => m.lessons);

  return {
    modulesCompleted: builtModules.length,
    courseDurationMinutes: lessons.reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0),
    quizzesPassed: lessons.flatMap((l) => l.blocks).filter((b) => b.type === "QUIZ").length,
  };
}

/**
 * The one place a Certificate row is ever created. Idempotent and race-safe:
 * `enrollmentId` is @unique on Certificate, so two concurrent calls for the
 * same enrollment (a student double-clicking "Generate") can never produce
 * two rows - the loser's `create` throws Postgres's unique-violation
 * (Prisma P2002), which this catches and simply returns the winner's row
 * instead of erroring, same shape as every other "claim" pattern in this
 * codebase (fulfillGuestOrder, claimLead).
 *
 * Re-verifies eligibility itself rather than trusting a caller that already
 * checked once - the only way into this function is through
 * generateCertificateAction, which is itself authenticated and
 * ownership-scoped, but defense-in-depth costs nothing here.
 *
 * Ownership is checked BEFORE the "already issued" fast path, not after -
 * an earlier version of this function checked `existing` first and returned
 * it unconditionally, which meant a second student who merely knew (or
 * guessed) someone else's enrollmentId could read back that other student's
 * already-issued certificate (name, email, course, dates) without ever
 * passing an eligibility check. `getCertificateEligibility` itself scopes
 * the enrollment lookup by `{ id, studentId }`, so an owner mismatch fails
 * closed here exactly the same way it does for a fresh issuance.
 */
export async function getOrIssueCertificate(enrollmentId: string, studentId: string): Promise<IssueCertificateResult> {
  const eligibility = await getCertificateEligibility(enrollmentId, studentId);
  if (!eligibility.eligible || !eligibility.enrollment || !eligibility.courseName || !eligibility.courseCode) {
    return { success: false, error: eligibility.reason ?? "You're not eligible for a certificate yet." };
  }

  // Ownership is already confirmed above - safe to fast-path an already-issued
  // certificate now, without burning a numbering sequence value on a create
  // that would only fail on the unique constraint anyway.
  const existing = await prisma.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return { success: true, certificate: existing, alreadyExisted: true };

  const { enrollment, courseName, courseCode } = eligibility;
  const now = new Date();
  const certificateNumber = await nextDocumentNumber(`CERT_${courseCode}`, `STV-${courseCode}`, now, 6);
  const stats = await computeCertificateStats(enrollment.offeringId);

  try {
    const certificate = await prisma.certificate.create({
      data: {
        enrollmentId,
        certificateNumber,
        templateId: "template-01",
        recipientName: enrollment.student.name!,
        recipientEmail: enrollment.student.email!,
        courseName,
        completionDate: enrollment.completionDate!,
        modulesCompleted: stats.modulesCompleted,
        courseDurationMinutes: stats.courseDurationMinutes,
        quizzesPassed: stats.quizzesPassed,
        status: "ISSUED",
        issuedAt: now,
      },
    });

    try {
      await sendCertificateIssuedEmail(certificate);
    } catch (error) {
      console.error("getOrIssueCertificate: issued email failed:", error);
    }

    return { success: true, certificate, alreadyExisted: false };
  } catch (error) {
    // Lost the race on enrollmentId's unique constraint - someone else's
    // create won between our findUnique above and this insert. Read back
    // the real row rather than surfacing an error for something that
    // actually succeeded.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.certificate.findUnique({ where: { enrollmentId } });
      if (winner) return { success: true, certificate: winner, alreadyExisted: true };
    }
    console.error("getOrIssueCertificate: create failed:", error);
    return { success: false, error: "Something went wrong generating your certificate. Please try again." };
  }
}
