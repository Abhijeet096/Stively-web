import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { EmptyState } from "@/components/sections/empty-state";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Invoices" };

/** Placeholder - Payments is future work (see the brief's explicit "keep architecture ready for... Payments, do NOT implement" scope). */
export default async function ClientInvoicesPage() {
  await requireRole("CLIENT");

  return (
    <>
      <SetPageTitle title="Invoices" />
      <Container className="py-8">
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices for your projects will appear here once billing begins."
        />
      </Container>
    </>
  );
}
