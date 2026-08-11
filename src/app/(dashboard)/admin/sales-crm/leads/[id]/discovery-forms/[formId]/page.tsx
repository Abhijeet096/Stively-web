import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/session";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getDiscoveryFormById } from "@/features/discovery-forms/server/queries";
import { DiscoveryFormResponse } from "@/features/discovery-forms/components/admin/discovery-form-response";
import { Button } from "@/components/ui/button";

interface DiscoveryFormDetailPageProps {
  params: Promise<{ id: string; formId: string }>;
}

export const metadata: Metadata = { title: "Discovery Form Response" };

export default async function DiscoveryFormDetailPage({ params }: DiscoveryFormDetailPageProps) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const { id, formId } = await params;

  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const form = await getDiscoveryFormById(formId, viewer);
  if (!form || form.salesLeadId !== id) notFound();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/sales-crm/leads/${id}`} aria-label="Back to lead">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Discovery Form - {form.salesLead.businessName}
        </h1>
      </div>

      <DiscoveryFormResponse form={form} />
    </div>
  );
}
