import type { OfferingEnrollment } from "@prisma/client";

export type EnrollmentEvent =
  | "ENROLLMENT_CREATED"
  | "ENROLLMENT_ACTIVATED"
  | "COURSE_STARTED"
  | "ENROLLMENT_REMINDER"
  | "ENROLLMENT_COMPLETED";

/**
 * Same "architecture only" stub as offering-requests/orders' own events.ts
 * - the one call site future email/notification delivery wires into.
 */
export function emitEnrollmentEvent(
  type: EnrollmentEvent,
  enrollment: Pick<OfferingEnrollment, "id" | "studentId" | "status">
): void {
  console.log(`[enrollment-event] ${type}`, { enrollmentId: enrollment.id, studentId: enrollment.studentId, status: enrollment.status });
}
