import "server-only";

import { prisma } from "@/lib/prisma";
import type { OfferingEnrollment, Order, OfferingRequest, OfferingEnrollmentStatus, AccessGrantReason } from "@prisma/client";
import { emitEnrollmentEvent } from "../lib/events";

interface CreateEnrollmentInput {
  studentId: string;
  offeringId: string;
  orderId?: string;
  offeringRequestId?: string;
  status: OfferingEnrollmentStatus;
  /** Only meaningful when status is ACTIVE at creation - why access was granted immediately. */
  accessGrantReason?: AccessGrantReason;
}

/**
 * The one real insert both origin-specific wrappers below call - a Draft
 * request or a Pending order never reaches this function at all (see each
 * wrapper's call site), so "one engine regardless of origin" holds without
 * duplicating the actual creation logic per origin.
 */
async function createEnrollment(input: CreateEnrollmentInput): Promise<OfferingEnrollment> {
  const isActive = input.status === "ACTIVE";
  const now = new Date();

  const enrollment = await prisma.offeringEnrollment.create({
    data: {
      studentId: input.studentId,
      offeringId: input.offeringId,
      orderId: input.orderId,
      offeringRequestId: input.offeringRequestId,
      status: input.status,
      startDate: isActive ? now : null,
      accessGranted: isActive,
      accessGrantedAt: isActive ? now : null,
      history: {
        create: { eventType: "CREATED", toStatus: input.status },
      },
      progressSnapshots: {
        // One real snapshot at creation, not a fabricated history - the
        // append-only log a future LMS writes into as real progress happens.
        create: { progressPercentage: 0 },
      },
      ...(isActive && input.accessGrantReason
        ? { accessGrants: { create: { granted: true, reason: input.accessGrantReason } } }
        : {}),
    },
  });

  emitEnrollmentEvent(isActive ? "ENROLLMENT_ACTIVATED" : "ENROLLMENT_CREATED", enrollment);
  return enrollment;
}

/**
 * Order PAID always means access is confirmed - payment already happened,
 * nothing left to wait for. Called from orders/actions/order-actions.ts's
 * verifyPayment success branch, the FREE short-circuit in createOrder, and
 * the webhook's PAID branch - the same three call sites Phase 7's
 * createOperationItemForOrder already touches.
 */
export async function createEnrollmentFromOrder(order: Order): Promise<OfferingEnrollment> {
  return createEnrollment({
    studentId: order.userId,
    offeringId: order.offeringId,
    orderId: order.id,
    status: "ACTIVE",
    accessGrantReason: "PAYMENT_CONFIRMED",
  });
}

/**
 * An Approved request only means access is confirmed today when the
 * offering is FREE - a paid CONSULTATION-flow offering has no online
 * payment step yet (the brief's own "Approved -> Payment (future) ->
 * Enrollment"), so it creates a PENDING, access-not-yet-granted enrollment
 * instead. An admin activates it manually once payment is confirmed
 * offline - see actions/admin-enrollment-actions.ts's activateEnrollment.
 */
export async function createEnrollmentFromRequest(request: OfferingRequest): Promise<OfferingEnrollment> {
  const offering = await prisma.offering.findUnique({ where: { id: request.offeringId } });
  const isFree = offering?.pricingType === "FREE";

  return createEnrollment({
    studentId: request.userId,
    offeringId: request.offeringId,
    offeringRequestId: request.id,
    status: isFree ? "ACTIVE" : "PENDING",
    accessGrantReason: isFree ? "FREE_OFFERING" : undefined,
  });
}

/**
 * The actual "mark an enrollment COMPLETED" write - extracted so both the
 * admin-triggered action (actions/admin-enrollment-actions.ts's
 * markCompleted, which wraps this with requireRole) and the
 * student-triggered automatic path (Phase 9's
 * src/features/learning/server/progression.ts, reached only via the
 * student's own ownership-checked lesson-completion actions - never a
 * second, unguarded entry point) share one real implementation instead of
 * two copies of the same status transition.
 */
export async function completeEnrollment(enrollmentId: string): Promise<OfferingEnrollment | null> {
  const current = await prisma.offeringEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!current || current.status === "COMPLETED") return current;

  const updated = await prisma.offeringEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: "COMPLETED",
      completionDate: new Date(),
      progressPercentage: 100,
      history: { create: { eventType: "COMPLETED", fromStatus: current.status, toStatus: "COMPLETED" } },
    },
  });
  emitEnrollmentEvent("ENROLLMENT_COMPLETED", updated);
  return updated;
}
