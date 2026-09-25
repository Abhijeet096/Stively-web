import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getStudentQueriesForAdmin } from "@/features/support/server/queries";
import { StudentQueryList } from "@/features/support/components/admin/student-query-list";

export const metadata: Metadata = { title: "Student Support" };

/**
 * Deliberately separate from /admin/leads and /admin/sales-crm/leads - a
 * StudentQuery is never a Lead (see the model's own schema comment), so it
 * gets its own page rather than a filtered view bolted onto either
 * pipeline.
 */
export default async function AdminStudentSupportPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const queries = await getStudentQueriesForAdmin();

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Student Support</h1>
      </div>

      <StudentQueryList queries={queries} />
    </div>
  );
}
