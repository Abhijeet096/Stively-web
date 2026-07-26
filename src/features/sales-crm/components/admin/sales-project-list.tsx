import Link from "next/link";
import { Briefcase } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { formatSalesProjectNumber } from "../../lib/reference-number";
import { SALES_PROJECT_STATUS_LABEL, SALES_PROJECT_STATUS_VARIANT } from "../../lib/labels";
import type { SalesProjectListItem } from "../../server/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function SalesProjectList({ projects, basePath = "/admin/sales-crm/projects" }: { projects: SalesProjectListItem[]; basePath?: string }) {
  if (projects.length === 0) {
    return <EmptyState icon={Briefcase} title="No projects yet" description="Projects appear here once a Won lead is converted." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Salesperson</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Received</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const received = project.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
          return (
            <TableRow key={project.id} className="hover:bg-accent/50">
              <TableCell className="p-0">
                <Link href={`${basePath}/${project.id}`} className="flex flex-col px-4 py-3">
                  <span className="text-foreground font-medium">{project.clientName}</span>
                  <span className="text-muted-foreground text-xs">{formatSalesProjectNumber(project.sequence)}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.salesPerson?.name ?? "Unassigned"}</TableCell>
              <TableCell className="text-foreground tabular-nums">{formatPrice(project.totalValue)}</TableCell>
              <TableCell className="text-foreground tabular-nums">{formatPrice(received)}</TableCell>
              <TableCell>
                <Badge variant={SALES_PROJECT_STATUS_VARIANT[project.status]}>{SALES_PROJECT_STATUS_LABEL[project.status]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(project.startDate)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export { SalesProjectList };
