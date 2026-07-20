import type { Metadata } from "next";

import {
  LeadTypeListPage,
  type LeadListSearchParams,
} from "@/components/dashboard/lead-type-list-page";

export const metadata: Metadata = { title: "Students" };

interface StudentsPageProps {
  searchParams: Promise<LeadListSearchParams>;
}

/** Thin wrapper - same shared list page, forced to leadType STUDENT. Not a separate feature. */
export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  return (
    <LeadTypeListPage
      title="Students"
      basePath="/admin/students"
      forcedLeadType="STUDENT"
      searchParams={params}
    />
  );
}
