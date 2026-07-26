import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { LeadIntelligenceSubnav } from "@/features/lead-intelligence/components/admin/lead-intelligence-subnav";
import { DiscoverPanel } from "@/features/lead-intelligence/components/admin/discover-panel";

export const metadata: Metadata = { title: "Discover Businesses" };

export default async function DiscoverPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");

  return (
    <div className="flex flex-col gap-8 p-6">
      <LeadIntelligenceSubnav active="Discover" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Discover businesses</h1>
        <p className="text-muted-foreground text-sm">Every result here comes from a real public source - nothing is fabricated.</p>
      </div>

      <DiscoverPanel />
    </div>
  );
}
