import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { getClientWorkspaceById } from "@/features/client-workspace/server/queries";
import { ClientWorkspaceDetail } from "@/features/client-workspace/components/client/client-workspace-detail";

interface ClientProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Project Workspace" };

export default async function ClientProjectDetailPage({ params }: ClientProjectDetailPageProps) {
  const user = await requireRole("CLIENT");
  const { id } = await params;

  const viewer = await resolveClientWorkspaceViewer(user.id);
  const lead = await getClientWorkspaceById(id, viewer);
  if (!lead) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <SetPageTitle title={lead.businessName} />
      <Container className="py-8">
        <ClientWorkspaceDetail
          lead={lead}
          userId={user.id}
          userName={user.name ?? undefined}
          userEmail={user.email ?? undefined}
          nonce={nonce}
        />
      </Container>
    </>
  );
}
