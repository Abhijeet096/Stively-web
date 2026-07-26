import Link from "next/link";
import { Building2 } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { SALES_LEAD_STATUS_LABEL, SALES_LEAD_STATUS_VARIANT, SALES_LEAD_SOURCE_LABEL, LEAD_PRIORITY_LABEL, LEAD_PRIORITY_VARIANT } from "../../lib/labels";
import { formatSalesLeadNumber } from "../../lib/reference-number";
import { formatPrice } from "@/lib/utils";
import type { SalesLeadWithOwner } from "../../server/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function SalesLeadList({ leads, basePath = "/admin/sales-crm/leads" }: { leads: SalesLeadWithOwner[]; basePath?: string }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No leads match these filters"
        description="Add a new lead, or clear the filters above."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Salesperson</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id} className="hover:bg-accent/50">
            <TableCell className="p-0">
              <Link href={`${basePath}/${lead.id}`} className="flex flex-col px-4 py-3">
                <span className="text-foreground font-medium">{lead.businessName}</span>
                <span className="text-muted-foreground text-xs">{formatSalesLeadNumber(lead.sequence)}</span>
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div className="flex flex-col">
                <span>{lead.ownerName}</span>
                <span className="text-xs">{lead.phone}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{SALES_LEAD_SOURCE_LABEL[lead.source]}</TableCell>
            <TableCell>
              <Badge variant={LEAD_PRIORITY_VARIANT[lead.priority]}>{LEAD_PRIORITY_LABEL[lead.priority]}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={SALES_LEAD_STATUS_VARIANT[lead.status]}>{SALES_LEAD_STATUS_LABEL[lead.status]}</Badge>
            </TableCell>
            <TableCell className="text-foreground tabular-nums">
              {lead.estimatedValue != null ? formatPrice(lead.estimatedValue) : <span className="text-muted-foreground">-</span>}
            </TableCell>
            <TableCell className="text-muted-foreground">{lead.assignedTo?.name ?? "Unassigned"}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { SalesLeadList };
