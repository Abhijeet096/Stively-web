import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getJobById, getAllInterviewTemplates } from "@/features/jobs/server/queries";
import { JobForm } from "@/features/jobs/components/admin/job-form";
import { Card, CardContent } from "@/components/ui/card";

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Job" };

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params;
  const [job, templates] = await Promise.all([getJobById(id), getAllInterviewTemplates()]);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Edit job</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <JobForm templates={templates} job={job} />
        </CardContent>
      </Card>
    </div>
  );
}
