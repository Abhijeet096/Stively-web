import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SalesLead, SalesProject } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWorkspacePhase } from "../../lib/workspace-status";

export interface ClientWorkspaceCardProps {
  lead: SalesLead & { projects: SalesProject[] };
}

function ClientWorkspaceCard({ lead }: ClientWorkspaceCardProps) {
  const phase = getWorkspacePhase(lead.projects);
  const active = lead.projects.find((p) => p.status === "ACTIVE") ?? lead.projects[0];
  return (
    <Link href={`/client/projects/${lead.id}`}>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center justify-between gap-4 py-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium">{lead.businessName}</span>
              <Badge variant={phase.variant}>{phase.label}</Badge>
              {lead.projects.length > 1 && (
                <span className="text-muted-foreground text-xs">{lead.projects.length} projects</span>
              )}
            </div>
            {active && <span className="text-muted-foreground text-sm">{active.progressPercent}% complete</span>}
          </div>
          <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  );
}

export { ClientWorkspaceCard };
