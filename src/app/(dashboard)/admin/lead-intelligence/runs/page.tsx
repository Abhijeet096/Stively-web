import type { Metadata } from "next";
import { History } from "lucide-react";

import { requireRole } from "@/lib/session";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { getRecentSearchRuns } from "@/features/lead-intelligence/server/queries";
import { LeadIntelligenceSubnav } from "@/features/lead-intelligence/components/admin/lead-intelligence-subnav";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const STATUS_VARIANT = { RUNNING: "warning", SUCCESS: "success", PARTIAL: "warning", FAILED: "destructive" } as const;
const TRIGGER_LABEL = { MANUAL: "Manual", CRON: "Scheduled" } as const;

export const metadata: Metadata = { title: "Connector Runs" };

export default async function RunsPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const runs = await getRecentSearchRuns();

  return (
    <div className="flex flex-col gap-8 p-6">
      <LeadIntelligenceSubnav active="Runs" />

      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Connector runs</h1>
        <p className="text-muted-foreground text-sm">Every discovery run, manual or scheduled - full audit trail.</p>
      </div>

      {runs.length === 0 ? (
        <EmptyState icon={History} title="No runs yet" description="Runs appear here once a connector search is triggered, manually or on schedule." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Connector</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duplicates</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Triggered by</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="text-foreground font-medium">{run.connectorType.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <Badge variant={run.trigger === "CRON" ? "secondary" : "default"}>{TRIGGER_LABEL[run.trigger]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                </TableCell>
                <TableCell className="text-foreground tabular-nums">{run.createdCount}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{run.duplicateCount}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{run.errorCount}</TableCell>
                <TableCell className="text-muted-foreground">{run.triggeredBy?.name ?? (run.trigger === "CRON" ? "System" : "—")}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(run.startedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
