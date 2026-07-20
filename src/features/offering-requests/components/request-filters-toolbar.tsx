"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { RequestStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useRequestFilters } from "../hooks/use-request-filters";
import { REQUEST_STATUS_LABEL } from "../lib/status-labels";

/** Status/date/search for "My Requests" - same URL-driven, instant-filter pattern as Phase 4's OfferingToolbar. */
function RequestFiltersToolbar() {
  const { searchParams, setFilter, clearFilters } = useRequestFilters();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const urlQuery = searchParams.get("q") ?? "";

  const [lastUrlQuery, setLastUrlQuery] = React.useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== urlQuery) setFilter("q", search.trim() || undefined);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const status = searchParams.get("status") ?? undefined;
  const since = searchParams.get("since") ?? "";
  const hasActiveFilters = !!(search || status || since);

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="request-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="request-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Request number or offering..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={status ?? "any"}
          onValueChange={(value) => setFilter("status", value === "any" ? undefined : value)}
        >
          <SelectTrigger id="status-filter" className="w-48">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any status</SelectItem>
            {Object.values(RequestStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {REQUEST_STATUS_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="since-filter">Since</Label>
        <Input
          id="since-filter"
          type="date"
          value={since}
          onChange={(event) => setFilter("since", event.target.value || undefined)}
          className="w-40"
        />
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
  );
}

export { RequestFiltersToolbar };
