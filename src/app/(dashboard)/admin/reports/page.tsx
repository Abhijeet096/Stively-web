import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";

export const metadata: Metadata = { title: "Reports" };

/** Placeholder, per this task's explicit sidebar spec - Analytics Charts are explicitly out of scope. */
export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Reports</h1>
      <EmptyState
        icon={BarChart3}
        title="Reports are coming soon"
        description="Deeper analytics and charts will live here once the reporting module is built."
      />
    </div>
  );
}
