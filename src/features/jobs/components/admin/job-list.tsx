import Link from "next/link";
import { Briefcase } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { JOB_STATUS_LABEL, JOB_STATUS_VARIANT } from "../../lib/labels";
import type { JobWithCounts } from "../../server/queries";

function JobList({ jobs }: { jobs: JobWithCounts[] }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Create a job to start inviting candidates to interview."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Template</TableHead>
          <TableHead>Candidates</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/admin/interviews/jobs/${job.id}`} className="text-foreground font-medium hover:underline">
                {job.title}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{job.department}</TableCell>
            <TableCell className="text-muted-foreground">{job.template.name}</TableCell>
            <TableCell className="text-muted-foreground tabular-nums">{job._count.candidates}</TableCell>
            <TableCell>
              <Badge variant={JOB_STATUS_VARIANT[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { JobList };
