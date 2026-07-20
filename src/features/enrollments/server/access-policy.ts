import "server-only";

import { prisma } from "@/lib/prisma";
import type { OfferingEnrollment, Offering } from "@prisma/client";

export interface EnrollmentAccessPolicy {
  enrollment: OfferingEnrollment;
  canAccessLearning: boolean;
  canDownloadResources: boolean;
  canViewCertificates: boolean;
  canViewMentor: boolean;
  isExpired: boolean;
  /** Set whenever canAccessLearning is false - the human-readable reason, so callers never have to re-derive it from status/accessGranted themselves. */
  reason?: string;
}

/**
 * The CEO's Access Policy recommendation - the one place every access
 * question is answered. Every future feature (a real LMS, certificates,
 * mentor portal, downloads, an AI assistant) should call this instead of
 * inspecting `enrollment.status`/`accessGranted` directly, so introducing
 * subscriptions/scholarships/trial access later is a change to this one
 * function, not a hunt across every page that currently checks enrollment
 * state inline.
 */
function evaluatePolicy(enrollment: OfferingEnrollment): EnrollmentAccessPolicy {
  const isExpired = !!enrollment.endDate && enrollment.endDate < new Date();
  // COMPLETED counts as accessible, not just ACTIVE - finishing a program's
  // curriculum shouldn't lock the student out of reviewing it afterward
  // (every real LMS keeps completed-course content viewable).
  const canAccessLearning =
    (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED") &&
    enrollment.accessGranted &&
    !isExpired;
  // Deliberately stricter than canAccessLearning, not a duplicate of it -
  // a real business rule (no certificate mid-course), and exactly the
  // kind of per-question distinction a flat "hasEnrollment" boolean can't express.
  const canViewCertificates = enrollment.status === "COMPLETED";

  return {
    enrollment,
    canAccessLearning,
    canDownloadResources: canAccessLearning,
    canViewCertificates,
    canViewMentor: canAccessLearning,
    isExpired,
    reason: canAccessLearning ? undefined : explainDenial(enrollment, isExpired),
  };
}

function explainDenial(enrollment: OfferingEnrollment, isExpired: boolean): string {
  if (isExpired) return "This enrollment has expired.";
  if (enrollment.status === "PENDING") return "Your enrollment is pending activation.";
  if (enrollment.status === "PAUSED") return "This enrollment is currently paused.";
  if (enrollment.status === "CANCELLED") return "This enrollment has been cancelled.";
  if (enrollment.status === "COMPLETED") return "This program has been completed.";
  if (!enrollment.accessGranted) return "Access hasn't been granted yet.";
  return "Access isn't available right now.";
}

/** Ownership-scoped - never trusts a client-supplied enrollmentId alone. */
export async function getAccessPolicyForEnrollment(
  enrollmentId: string,
  studentId: string
): Promise<EnrollmentAccessPolicy | null> {
  const enrollment = await prisma.offeringEnrollment.findFirst({ where: { id: enrollmentId, studentId } });
  return enrollment ? evaluatePolicy(enrollment) : null;
}

export interface StudentAccessSummary {
  hasAnyAccess: boolean;
  activeEnrollments: (OfferingEnrollment & { offering: Offering })[];
  primaryEnrollment: (OfferingEnrollment & { offering: Offering }) | null;
}

/**
 * Powers the dashboard/nav "does this student see learning content at all"
 * decision - a student can have multiple enrollments (multiple offerings),
 * so this summarizes across all of them rather than assuming exactly one.
 */
export async function getStudentAccessSummary(studentId: string): Promise<StudentAccessSummary> {
  const enrollments = await prisma.offeringEnrollment.findMany({
    where: { studentId },
    include: { offering: true },
    orderBy: { createdAt: "desc" },
  });

  const activeEnrollments = enrollments.filter((enrollment) => evaluatePolicy(enrollment).canAccessLearning);

  return {
    hasAnyAccess: activeEnrollments.length > 0,
    activeEnrollments,
    primaryEnrollment: activeEnrollments[0] ?? null,
  };
}
