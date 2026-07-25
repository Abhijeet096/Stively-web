"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@prisma/client";
import { Pencil, UserPlus, Trash2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { JOB_STATUS_LABEL, JOB_STATUS_VARIANT } from "../../lib/labels";
import { setJobStatus, deleteJob } from "../../actions/admin-job-actions";
import type { JobWithTemplate } from "../../server/queries";

const STATUS_OPTIONS: JobStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "CLOSED"];

function JobDetail({ job, candidateCount }: { job: JobWithTemplate; candidateCount: number }) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleStatusChange(status: JobStatus) {
    setIsPending(true);
    await setJobStatus(job.id, status);
    setIsPending(false);
    router.refresh();
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteJob(job.id);
    setIsDeleting(false);
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    router.push("/admin/interviews/jobs");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{job.title}</h1>
            <Badge variant={JOB_STATUS_VARIANT[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {job.department} - {job.experience} - {job.duration} min interview - {job.template.name} template
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/interviews/jobs/${job.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/interviews/candidates/invite?jobId=${job.id}`}>
              <UserPlus className="size-4" aria-hidden="true" />
              Invite candidate
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-foreground text-sm whitespace-pre-line">{job.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Only published jobs should be actively receiving candidates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={job.status} onValueChange={(v) => handleStatusChange(v as JobStatus)} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {JOB_STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidates</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-foreground font-display text-2xl font-semibold tabular-nums">
                {candidateCount}
              </span>
              <Button variant="link" asChild className="px-0">
                <Link href={`/admin/interviews/candidates?jobId=${job.id}`}>View all</Link>
              </Button>
            </CardContent>
          </Card>

          {candidateCount === 0 && (
            <Button variant="outline" size="sm" loading={isDeleting} onClick={handleDelete} className="w-full">
              <Trash2 className="size-4" aria-hidden="true" />
              Delete job
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export { JobDetail };
