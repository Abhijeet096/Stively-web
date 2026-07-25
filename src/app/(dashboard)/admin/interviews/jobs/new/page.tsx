import type { Metadata } from "next";

import { getAllInterviewTemplates } from "@/features/jobs/server/queries";
import { JobForm } from "@/features/jobs/components/admin/job-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "New Job" };

export default async function NewJobPage() {
  const templates = await getAllInterviewTemplates();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">New job</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <JobForm templates={templates} />
        </CardContent>
      </Card>
    </div>
  );
}
