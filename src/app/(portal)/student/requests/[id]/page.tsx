import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { FileEdit } from "lucide-react";

import { requireRole } from "@/lib/session";
import { getRequestById } from "@/features/offering-requests/server/queries";
import { formatRequestNumber } from "@/features/offering-requests/lib/request-number";
import { RequestDetailView } from "@/features/offering-requests/components/request-detail-view";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

interface StudentRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StudentRequestDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Request ${id.slice(0, 8)}` };
}

export default async function StudentRequestDetailPage({ params }: StudentRequestDetailPageProps) {
  const user = await requireRole("STUDENT");
  const { id } = await params;

  const request = await getRequestById(id, user.id);
  if (!request) {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <SetPageTitle title={formatRequestNumber(request.sequence)} />
      <Container className="py-8">
        {request.status === "DRAFT" ? (
          <EmptyState
            icon={FileEdit}
            title="This application isn't submitted yet"
            description={`You're on step ${request.currentStep} for ${request.offering.title}. Pick up where you left off.`}
            actionLabel="Continue application"
            actionHref={`/enroll/${request.offering.slug}`}
          />
        ) : (
          <RequestDetailView
            request={request}
            userName={user.name ?? undefined}
            userEmail={user.email ?? undefined}
            detailPathPrefix="/student/requests"
            nonce={nonce}
          />
        )}
      </Container>
    </>
  );
}
