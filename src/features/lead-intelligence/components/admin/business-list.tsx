"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Ban } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { BUSINESS_STATUS_LABEL, BUSINESS_STATUS_VARIANT, BUSINESS_DATA_SOURCE_LABEL, opportunityScoreTier } from "../../lib/labels";
import { bulkDismissBusinesses } from "../../actions/business-actions";
import type { BusinessListRow } from "../../server/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

/** `selectable` enables bulk-select checkboxes + a "Dismiss selected" bar (the SRS's Bulk Actions requirement) - off by default so preview lists (dashboard's "Recent businesses") stay simple. */
function BusinessList({ businesses, selectable = false }: { businesses: BusinessListRow[]; selectable?: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isDismissing, setIsDismissing] = React.useState(false);

  if (businesses.length === 0) {
    return (
      <EmptyState icon={Building2} title="No businesses match these filters" description="Discover new businesses, import a CSV, or clear the filters above." />
    );
  }

  const allSelected = selectable && businesses.length > 0 && businesses.every((b) => selected.has(b.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(businesses.map((b) => b.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDismiss() {
    setIsDismissing(true);
    const result = await bulkDismissBusinesses(Array.from(selected));
    setIsDismissing(false);
    if (result.success) {
      setSelected(new Set());
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {selectable && selected.size > 0 && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2">
          <span className="text-foreground text-sm">
            {selected.size} selected
          </span>
          <Button size="sm" variant="outline" loading={isDismissing} onClick={handleBulkDismiss}>
            <Ban className="size-4" aria-hidden="true" />
            Dismiss selected
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </TableHead>
            )}
            <TableHead>Business</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Website score</TableHead>
            <TableHead>Opportunity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Discovered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {businesses.map((business) => {
            const latestReport = business.aiReports[0];
            const latestAnalysis = business.websiteAnalyses[0];
            const tier = latestReport ? opportunityScoreTier(latestReport.opportunityScore) : null;

            return (
              <TableRow key={business.id} className="hover:bg-accent/50">
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(business.id)}
                      onChange={() => toggleOne(business.id)}
                      aria-label={`Select ${business.businessName}`}
                    />
                  </TableCell>
                )}
                <TableCell className="p-0">
                  <Link href={`/admin/lead-intelligence/businesses/${business.id}`} className="flex flex-col px-4 py-3">
                    <span className="text-foreground font-medium">{business.businessName}</span>
                    <span className="text-muted-foreground text-xs">{business.city ?? business.website ?? "—"}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{business.industry ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{BUSINESS_DATA_SOURCE_LABEL[business.dataSource]}</TableCell>
                <TableCell className="text-foreground tabular-nums">
                  {latestAnalysis?.overallScore != null ? `${latestAnalysis.overallScore}/100` : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {latestReport && tier ? (
                    <Badge variant={tier.variant}>
                      {latestReport.opportunityScore}/100 · {tier.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not scored</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={BUSINESS_STATUS_VARIANT[business.status]}>{BUSINESS_STATUS_LABEL[business.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(business.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { BusinessList };
