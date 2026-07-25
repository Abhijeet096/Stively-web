import Link from "next/link";
import { Users } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { LINK_STATUS_LABEL, LINK_STATUS_VARIANT } from "../../lib/labels";
import { INTERVIEW_STATUS_LABEL, INTERVIEW_STATUS_VARIANT, RECOMMENDATION_LABEL, RECOMMENDATION_VARIANT } from "@/features/interviews/lib/report-labels";
import type { CandidateForReview } from "../../server/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function CandidateList({ candidates }: { candidates: CandidateForReview[] }) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No candidates match these filters"
        description="Invite a candidate to generate their first interview link, or clear the filters above."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Invited</TableHead>
          <TableHead>Link status</TableHead>
          <TableHead>Interview status</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Recommendation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => {
          const latestLink = candidate.links[0];
          const interview = latestLink?.interview;
          const score = interview?.score;
          return (
            <TableRow key={candidate.id} className="hover:bg-accent/50 cursor-pointer">
              <TableCell className="p-0">
                <Link href={`/admin/interviews/candidates/${candidate.id}`} className="flex flex-col px-4 py-3">
                  <span className="text-foreground font-medium">{candidate.name}</span>
                  <span className="text-muted-foreground text-xs">{candidate.email}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{candidate.job.title}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(candidate.createdAt)}</TableCell>
              <TableCell>
                {latestLink ? (
                  <Badge variant={LINK_STATUS_VARIANT[latestLink.status]}>{LINK_STATUS_LABEL[latestLink.status]}</Badge>
                ) : (
                  <Badge variant="outline">No link</Badge>
                )}
              </TableCell>
              <TableCell>
                {interview ? (
                  <Badge variant={INTERVIEW_STATUS_VARIANT[interview.status]}>
                    {INTERVIEW_STATUS_LABEL[interview.status]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-foreground tabular-nums">
                {score ? `${Math.round(score.overall)}/100` : <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell>
                {score ? (
                  <Badge variant={RECOMMENDATION_VARIANT[score.recommendation]}>
                    {RECOMMENDATION_LABEL[score.recommendation]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export { CandidateList };
