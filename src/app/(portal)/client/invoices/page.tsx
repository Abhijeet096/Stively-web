import type { Metadata } from "next";
import { headers } from "next/headers";
import { Receipt } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { getClientPayments } from "@/features/client-workspace/server/queries";
import { ClientPaymentsList } from "@/features/client-workspace/components/client/client-payments-list";

export const metadata: Metadata = { title: "Invoices" };

export default async function ClientInvoicesPage() {
  const user = await requireRole("CLIENT");

  const viewer = await resolveClientWorkspaceViewer(user.id);
  const payments = await getClientPayments(viewer);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <SetPageTitle title="Invoices" />
      <Container className="flex flex-col gap-8 py-8">
        <SectionHeader title="Invoices" description="Every installment across your projects - pay, and download the invoice or receipt once uploaded." />

        {payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Invoices for your projects will appear here once billing begins."
          />
        ) : (
          <ClientPaymentsList payments={payments} userName={user.name ?? undefined} userEmail={user.email ?? undefined} nonce={nonce} showBusiness />
        )}
      </Container>
    </>
  );
}
