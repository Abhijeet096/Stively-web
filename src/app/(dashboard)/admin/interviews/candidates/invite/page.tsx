import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/features/candidates/components/admin/invite-form";
import { Card, CardContent } from "@/components/ui/card";

interface InviteCandidatePageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export const metadata: Metadata = { title: "Invite Candidate" };

/**
 * Only PUBLISHED jobs are offered here - inviting a candidate to a DRAFT or
 * ARCHIVED job would generate a link to a role that isn't actually open.
 */
export default async function InviteCandidatePage({ searchParams }: InviteCandidatePageProps) {
  const { jobId } = await searchParams;
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Invite candidate</h1>
        <p className="text-muted-foreground text-sm">Generates a secure, one-time interview link.</p>
      </div>
      <Card className="max-w-xl">
        <CardContent>
          <InviteForm jobs={jobs} defaultJobId={jobId} />
        </CardContent>
      </Card>
    </div>
  );
}
