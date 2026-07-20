import type { Metadata } from "next";

import {
  LeadTypeListPage,
  type LeadListSearchParams,
} from "@/components/dashboard/lead-type-list-page";

export const metadata: Metadata = { title: "Leads" };

interface LeadsPageProps {
  searchParams: Promise<LeadListSearchParams>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  return <LeadTypeListPage title="Leads" basePath="/admin/leads" searchParams={params} />;
}
