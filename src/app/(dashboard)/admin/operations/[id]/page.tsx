import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveOperationsViewer } from "@/features/operations/server/rbac";
import { getOperationItemById } from "@/features/operations/server/queries";
import { formatOperationNumber } from "@/features/operations/lib/operation-number";
import { OperationDetailView } from "@/features/operations/components/operation-detail-view";
import { getEnrollmentByOrderId, getEnrollmentByRequestId } from "@/features/enrollments/server/queries";
import { getMentorForOperationsCard } from "@/features/mentors/server/queries";

interface OperationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OperationDetailPageProps): Promise<Metadata> {
  const session = await auth();
  if (!session?.user) return { title: "Operation not found" };
  const viewer = await resolveOperationsViewer(session.user.id, session.user.role);

  const { id } = await params;
  // Same viewer-scoped lookup as the page body - the title must not
  // confirm an OPS number exists to someone who isn't allowed to see it.
  const item = await getOperationItemById(id, viewer);
  return { title: item ? formatOperationNumber(item.sequence) : "Operation not found" };
}

export default async function OperationDetailPage({ params }: OperationDetailPageProps) {
  const session = await auth();
  const viewer = await resolveOperationsViewer(session!.user.id, session!.user.role);

  const { id } = await params;

  const [item, teamMembers] = await Promise.all([
    getOperationItemById(id, viewer),
    prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!item) {
    notFound();
  }

  const enrollment = item.requestId
    ? await getEnrollmentByRequestId(item.requestId)
    : item.orderId
      ? await getEnrollmentByOrderId(item.orderId)
      : null;

  const studentId = enrollment?.studentId ?? item.request?.userId ?? item.order?.userId;
  const mentorAssignments = studentId ? await getMentorForOperationsCard(studentId, enrollment?.id) : [];

  return (
    <OperationDetailView item={item} teamMembers={teamMembers} enrollment={enrollment} mentorAssignments={mentorAssignments} />
  );
}
