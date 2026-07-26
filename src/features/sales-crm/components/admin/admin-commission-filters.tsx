import Link from "next/link";
import type { TeamMember } from "@prisma/client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SALES_COMMISSION_STATUS_LABEL } from "../../lib/labels";

const STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"] as const;

const nativeSelectClassName =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/** Same zero-JS native <form method="get"> pattern as LeadsFilters. */
function AdminCommissionFilters({
  status,
  salesPersonId,
  teamMembers,
}: {
  status?: string;
  salesPersonId?: string;
  teamMembers: TeamMember[];
}) {
  return (
    <form method="get" action="/admin/sales-crm/commission" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={status ?? ""} className={nativeSelectClassName}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {SALES_COMMISSION_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="salesPersonId">Salesperson</Label>
        <select id="salesPersonId" name="salesPersonId" defaultValue={salesPersonId ?? ""} className={nativeSelectClassName}>
          <option value="">All</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Apply filters</Button>

      {(status || salesPersonId) && (
        <Button type="button" variant="ghost" asChild>
          <Link href="/admin/sales-crm/commission">Clear filters</Link>
        </Button>
      )}
    </form>
  );
}

export { AdminCommissionFilters };
