import "server-only";

import { prisma } from "@/lib/prisma";
import type { OfferingEnrollment, Offering, EnrollmentHistory } from "@prisma/client";

export type EnrollmentWithOffering = OfferingEnrollment & { offering: Offering };
export type EnrollmentWithHistory = EnrollmentWithOffering & { history: EnrollmentHistory[] };

/** "My Requests"/"My Orders"-equivalent for enrollments - ownership-scoped to the signed-in student. */
export async function getMyEnrollments(studentId: string): Promise<EnrollmentWithOffering[]> {
  return prisma.offeringEnrollment.findMany({
    where: { studentId },
    include: { offering: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Ownership-scoped single lookup - returns null (not the row) if it isn't the caller's, same discipline as every other feature's getXById. */
export async function getEnrollmentById(id: string, studentId: string): Promise<EnrollmentWithOffering | null> {
  return prisma.offeringEnrollment.findFirst({
    where: { id, studentId },
    include: { offering: true },
  });
}

/** Same ownership scoping as getEnrollmentById, plus the full Timeline for the My Learning page. */
export async function getEnrollmentWithHistory(id: string, studentId: string): Promise<EnrollmentWithHistory | null> {
  return prisma.offeringEnrollment.findFirst({
    where: { id, studentId },
    include: { offering: true, history: { orderBy: { createdAt: "asc" } } },
  });
}

/**
 * Admin-facing lookups (no ownership scoping - callers are already gated
 * by requireRole) for the Operations detail page integration
 * (src/features/operations/components/operation-detail-view.tsx), which
 * needs to show the real enrollment behind a Request/Order if one exists.
 */
export async function getEnrollmentByOrderId(orderId: string): Promise<OfferingEnrollment | null> {
  return prisma.offeringEnrollment.findUnique({ where: { orderId } });
}

export async function getEnrollmentByRequestId(offeringRequestId: string): Promise<OfferingEnrollment | null> {
  return prisma.offeringEnrollment.findUnique({ where: { offeringRequestId } });
}
