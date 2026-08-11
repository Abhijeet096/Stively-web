import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { getClientProjectById } from "@/features/client-workspace/server/queries";
import { ClientProjectDetail } from "@/features/client-workspace/components/client/client-project-detail";
import { getOnboardingFormsForClientProject } from "@/features/onboarding-forms/server/queries";
import { prisma } from "@/lib/prisma";

interface ClientProjectDetailPageProps {
  params: Promise<{ id: string; projectId: string }>;
}

export const metadata: Metadata = { title: "Project" };

export default async function ClientProjectSubPage({ params }: ClientProjectDetailPageProps) {
  const user = await requireRole("CLIENT");
  const { id, projectId } = await params;

  const viewer = await resolveClientWorkspaceViewer(user.id);
  if (!viewer.salesLeadIds.includes(id)) notFound();

  const [project, lead, onboardingForms] = await Promise.all([
    getClientProjectById(id, projectId, viewer),
    prisma.salesLead.findUnique({ where: { id }, select: { businessName: true } }),
    getOnboardingFormsForClientProject(projectId, viewer),
  ]);
  if (!project || !lead) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <SetPageTitle title={project.name} />
      <Container className="py-8">
        <ClientProjectDetail
          leadId={id}
          businessName={lead.businessName}
          project={project}
          onboardingForms={onboardingForms}
          userName={user.name ?? undefined}
          userEmail={user.email ?? undefined}
          nonce={nonce}
        />
      </Container>
    </>
  );
}
