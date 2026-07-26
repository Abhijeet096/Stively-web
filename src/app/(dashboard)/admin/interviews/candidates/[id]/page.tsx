import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCandidateReport } from "@/features/candidates/server/queries";
import { CandidateReport } from "@/features/candidates/components/admin/candidate-report";
import { getHireStatusForCandidate } from "@/features/sales-crm/actions/hire-actions";

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Candidate Report" };

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = await params;
  const candidate = await getCandidateReport(id);
  if (!candidate) notFound();

  const alreadyHired = await getHireStatusForCandidate(candidate.email);

  return (
    <div className="p-6">
      <CandidateReport candidate={candidate} alreadyHired={alreadyHired} />
    </div>
  );
}
