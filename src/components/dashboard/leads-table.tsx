import Link from "next/link";
import { Eye, Users } from "lucide-react";

import type { LeadWithOwner } from "@/lib/queries/leads";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sections/empty-state";
import { LeadStatusBadge } from "@/components/dashboard/lead-status-badge";

const SOURCE_LABEL: Record<string, string> = {
  CONTACT_FORM: "Contact Form",
  PROGRAM_INTEREST: "Program Interest",
  CAREERS: "Careers",
  NEWSLETTER_POPUP: "Newsletter",
  OTHER: "Other",
};

/**
 * One table component, two callers (dashboard home's "Recent Leads",
 * /dashboard/leads' full list) - same columns either way per this task's
 * spec, so building it twice would be exactly the duplicated UI this
 * task explicitly says not to produce.
 */
function LeadsTable({ leads }: { leads: LeadWithOwner[] }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No leads yet"
        description="Leads submitted through the Contact page will show up here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-foreground font-medium">{lead.name}</span>
                <span className="text-muted-foreground text-xs">
                  {lead.companyName ?? lead.email}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {lead.leadType === "STUDENT" ? "Student" : "Business"}
              </Badge>
            </TableCell>
            <TableCell>
              <LeadStatusBadge status={lead.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {lead.currentOwner?.name ?? "Unassigned"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {SOURCE_LABEL[lead.source] ?? lead.source}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(lead.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/leads/${lead.id}`}>
                  <Eye className="size-3.5" aria-hidden="true" />
                  View
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { LeadsTable };
