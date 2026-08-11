"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { SalesLeadStatus, LeadPriority, SalesLeadSource, TeamMember } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSalesLeadFilters } from "../../hooks/use-sales-lead-filters";
import { SALES_LEAD_STATUS_LABEL, SALES_LEAD_SOURCE_LABEL, LEAD_PRIORITY_LABEL } from "../../lib/labels";

const STATUSES: SalesLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
];
const PRIORITIES: LeadPriority[] = ["LOW", "MEDIUM", "HIGH"];
const SOURCES: SalesLeadSource[] = [
  "WEBSITE",
  "WHATSAPP",
  "LINKEDIN",
  "COLD_CALLING",
  "REFERRAL",
  "INDIAMART",
  "GOOGLE_MAPS",
  "FACEBOOK",
  "INSTAGRAM",
  "MANUAL",
  "OTHER",
];

export interface SalesLeadFiltersToolbarProps {
  teamMembers: TeamMember[];
  /** Hidden for a restricted (SALESPERSON) viewer - they only ever see their own leads, a salesperson filter would be a no-op. */
  showAssigneeFilter: boolean;
}

/** Same instant, URL-driven Select pattern as operations/components/operation-filters-toolbar.tsx. Picking an exact status here clears the page's `?stage=` quick-filter in the same navigation - the two are mutually exclusive ways of narrowing by status. */
function SalesLeadFiltersToolbar({ teamMembers, showAssigneeFilter }: SalesLeadFiltersToolbarProps) {
  const { searchParams, setFilter, setFilters, clearFilters } = useSalesLeadFilters();
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = React.useState(urlQuery);

  const [lastUrlQuery, setLastUrlQuery] = React.useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== (searchParams.get("q") ?? "")) {
        setFilter("q", search.trim() || undefined);
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const assignedToId = searchParams.get("assignedToId") ?? undefined;

  const hasActiveFilters = !!(search || status || priority || source || assignedToId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="sales-lead-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="sales-lead-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Business, owner, phone, email..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={status ?? "any"}
            onValueChange={(value) => setFilters({ status: value === "any" ? undefined : value, stage: undefined })}
          >
            <SelectTrigger id="status-filter" className="w-44">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SALES_LEAD_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select value={priority ?? "any"} onValueChange={(value) => setFilter("priority", value === "any" ? undefined : value)}>
            <SelectTrigger id="priority-filter" className="w-36">
              <SelectValue placeholder="Any priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any priority</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {LEAD_PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source-filter">Source</Label>
          <Select value={source ?? "any"} onValueChange={(value) => setFilter("source", value === "any" ? undefined : value)}>
            <SelectTrigger id="source-filter" className="w-40">
              <SelectValue placeholder="Any source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any source</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SALES_LEAD_SOURCE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showAssigneeFilter && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assignee-filter">Salesperson</Label>
            <Select
              value={assignedToId ?? "any"}
              onValueChange={(value) => setFilter("assignedToId", value === "any" ? undefined : value)}
            >
              <SelectTrigger id="assignee-filter" className="w-44">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Anyone</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              clearFilters();
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export { SalesLeadFiltersToolbar };
