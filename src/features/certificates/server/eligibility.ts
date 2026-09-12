import "server-only";

import { prisma } from "@/lib/prisma";
import { getAccessPolicyForEnrollment } from "@/features/enrollments/server/access-policy";
import { getCourseCertificateConfig } from "../lib/course-config";

export interface CertificateEligibility {
  eligible: boolean;
  reason?: string;
  enrollment?: Awaited<ReturnType<typeof prisma.offeringEnrollment.findFirst>> & {
    offering: { slug: string; title: string };
    student: { name: string | null; email: string | null };
  };
  courseName?: string;
  courseCode?: string;
}

/**
 * The one gate certificate issuance ever checks - reuses
 * getAccessPolicyForEnrollment's `canViewCertificates` (the existing,
 * already-ownership-scoped business rule: enrollment.status === "COMPLETED")
 * rather than inventing a second completion check. Never trusts a
 * client-supplied studentId - always the authenticated session's own id.
 */
export async function getCertificateEligibility(enrollmentId: string, studentId: string): Promise<CertificateEligibility> {
  const policy = await getAccessPolicyForEnrollment(enrollmentId, studentId);
  if (!policy) return { eligible: false, reason: "Enrollment not found." };
  if (!policy.canViewCertificates) {
    return { eligible: false, reason: policy.reason ?? "This program hasn't been completed yet." };
  }

  const enrollment = await prisma.offeringEnrollment.findFirst({
    where: { id: enrollmentId, studentId },
    include: { offering: { select: { slug: true, title: true } }, student: { select: { name: true, email: true } } },
  });
  if (!enrollment) return { eligible: false, reason: "Enrollment not found." };

  const courseConfig = getCourseCertificateConfig(enrollment.offering.slug);
  if (!courseConfig) return { eligible: false, reason: "This course doesn't issue certificates yet." };

  if (!enrollment.student.name?.trim()) {
    return { eligible: false, reason: "Add your full name to your profile before generating a certificate." };
  }
  if (!enrollment.student.email) {
    return { eligible: false, reason: "Your account needs a verified email before generating a certificate." };
  }
  if (!enrollment.completionDate) {
    return { eligible: false, reason: "This program hasn't been completed yet." };
  }

  return {
    eligible: true,
    enrollment: enrollment as CertificateEligibility["enrollment"],
    courseName: courseConfig.courseName,
    courseCode: courseConfig.prefix,
  };
}
