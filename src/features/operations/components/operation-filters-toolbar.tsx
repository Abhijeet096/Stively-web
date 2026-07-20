"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { TeamMember } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOperationFilters } from "../hooks/use-operation-filters";
import { REQUEST_PIPELINE, getRequestStageLabel, ORDER_PIPELINE, ORDER_STAGE_LABEL } from "../lib/stage-labels";
import { PRIORITY_LABEL } from "./operation-priority-badge";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export interface OperationFiltersToolbarProps {
  teamMembers: TeamMember[];
}

/** Same instant, URL-driven Select pattern as offerings/components/offering-toolbar.tsx. Status options depend on the selected Type, since RequestStatus and OrderStatus are different enums matched via separate OR branches in the query layer. */
function OperationFiltersToolbar({ teamMembers }: OperationFiltersToolbarProps) {
  const { searchParams, setFilter, clearFilters } = useOperationFilters();
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = React.useState(urlQuery);

  // Resets the local input when the URL's `q` changes from outside this
  // component (Clear filters, browser back/forward) - adjusted during
  // render per React's "adjusting state when a prop changes" pattern
  // (react.dev), not inside an effect, so it doesn't cascade an extra
  // render. Same fix already applied to offerings/components/offering-toolbar.tsx.
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

  const type = searchParams.get("type") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const assignedTo = searchParams.get("assignedTo") ?? undefined;

  const hasActiveFilters = !!(search || type || status || priority || assignedTo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="ops-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="ops-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Customer, offering..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type-filter">Type</Label>
          <Select
            value={type ?? "any"}
            onValueChange={(value) => {
              setFilter("type", value === "any" ? undefined : value);
              setFilter("status", undefined); // status options depend on type
            }}
          >
            <SelectTrigger id="type-filter" className="w-36">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any type</SelectItem>
              <SelectItem value="REQUEST">Request</SelectItem>
              <SelectItem value="ORDER">Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status ?? "any"} onValueChange={(value) => setFilter("status", value === "any" ? undefined : value)}>
              <SelectTrigger id="status-filter" className="w-44">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                {type === "REQUEST"
                  ? REQUEST_PIPELINE.map((s) => (
                      <SelectItem key={s} value={s}>
                        {getRequestStageLabel(s, "STUDENT")}
                      </SelectItem>
                    ))
                  : ORDER_PIPELINE.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STAGE_LABEL[s]}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select
            value={priority ?? "any"}
            onValueChange={(value) => setFilter("priority", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="priority-filter" className="w-36">
              <SelectValue placeholder="Any priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any priority</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assigned-filter">Assigned to</Label>
          <Select
            value={assignedTo ?? "any"}
            onValueChange={(value) => setFilter("assignedTo", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="assigned-filter" className="w-44">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Anyone</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

export { OperationFiltersToolbar };
