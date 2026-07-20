import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileEdit } from "lucide-react";

import { requireRole } from "@/lib/session";
import { getRequestById } from "@/features/offering-requests/server/queries";
import { formatRequestNumber } from "@/features/offering-requests/lib/request-number";
import { RequestDetailView } from "@/features/offering-requests/components/request-detail-view";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

interface ClientRequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClientRequestDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Request ${id.slice(0, 8)}` };
}

export default async function ClientRequestDetailPage({ params }: ClientRequestDetailPageProps) {
  const user = await requireRole("CLIENT");
  const { id } = await params;

  const request = await getRequestById(id, user.id);
  if (!request) {
    notFound();
  }

  return (
    <>
      <SetPageTitle title={formatRequestNumber(request.sequence)} />
      <Container className="py-8">
        {request.status === "DRAFT" ? (
          <EmptyState
            icon={FileEdit}
            title="This request isn't submitted yet"
            description={`You're on step ${request.currentStep} for ${request.offering.title}. Pick up where you left off.`}
            actionLabel="Continue request"
            actionHref={`/request-proposal/${request.offering.slug}`}
          />
        ) : (
          <RequestDetailView request={request} />
        )}
      </Container>
    </>
  );
}
