"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportSalesLeads } from "../../actions/export-actions";
import type { SalesLeadFilters, SalesLeadWithOwner } from "../../server/queries";
import { SALES_LEAD_SOURCE_LABEL, SALES_LEAD_STATUS_LABEL, LEAD_PRIORITY_LABEL } from "../../lib/labels";
import { formatSalesLeadNumber } from "../../lib/reference-number";

function toCsv(leads: SalesLeadWithOwner[]): string {
  const header = ["Reference", "Business Name", "Owner Name", "Phone", "WhatsApp", "Email", "City", "State", "Source", "Status", "Priority", "Estimated Value", "Salesperson", "Created"];
  const rows = leads.map((lead) => [
    formatSalesLeadNumber(lead.sequence),
    lead.businessName,
    lead.ownerName,
    lead.phone,
    lead.whatsapp ?? "",
    lead.email ?? "",
    lead.city ?? "",
    lead.state ?? "",
    SALES_LEAD_SOURCE_LABEL[lead.source],
    SALES_LEAD_STATUS_LABEL[lead.status],
    LEAD_PRIORITY_LABEL[lead.priority],
    lead.estimatedValue != null ? (lead.estimatedValue / 100).toFixed(2) : "",
    lead.assignedTo?.name ?? "",
    new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(lead.createdAt),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function ExportLeadsButton({ filters }: { filters: SalesLeadFilters }) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleExport() {
    setIsPending(true);
    setError(undefined);
    const result = await exportSalesLeads(filters);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const csv = toCsv(result.leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleExport} loading={isPending}>
        <Download className="size-4" aria-hidden="true" />
        Export CSV
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export { ExportLeadsButton };
