import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getActiveScoringConfig } from "@/features/lead-intelligence/server/generate-report";
import { getSuggestedWeightAdjustments } from "@/features/lead-intelligence/server/learning-engine";
import { LeadIntelligenceSubnav } from "@/features/lead-intelligence/components/admin/lead-intelligence-subnav";
import { ScoringConfigPanel } from "@/features/lead-intelligence/components/admin/scoring-config-panel";

export const metadata: Metadata = { title: "Scoring Configuration" };

export default async function ScoringConfigPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const config = await getActiveScoringConfig();
  const suggestions = await getSuggestedWeightAdjustments(config);

  return (
    <div className="flex flex-col gap-8 p-6">
      <LeadIntelligenceSubnav active="Scoring" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Scoring configuration</h1>
        <p className="text-muted-foreground text-sm">Opportunity Score weights - admin-editable, never hardcoded.</p>
      </div>

      <ScoringConfigPanel config={config} suggestions={suggestions} />
    </div>
  );
}
