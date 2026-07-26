"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { BusinessStatus, BusinessDataSource } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useBusinessFilters } from "../../hooks/use-business-filters";
import { BUSINESS_STATUS_LABEL, BUSINESS_DATA_SOURCE_LABEL } from "../../lib/labels";

const STATUSES: BusinessStatus[] = ["NEW", "ANALYZED", "PROMOTED", "DISMISSED"];
const SOURCES: BusinessDataSource[] = ["GOOGLE_PLACES", "WEBSITE", "MANUAL_IMPORT", "MANUAL_ENTRY"];

/** Same instant, URL-driven Select pattern as sales-crm's SalesLeadFiltersToolbar. */
function BusinessFiltersToolbar({ industries }: { industries: string[] }) {
  const { searchParams, setFilter, clearFilters } = useBusinessFilters();
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
  const dataSource = searchParams.get("dataSource") ?? undefined;
  const industry = searchParams.get("industry") ?? undefined;
  const minScore = searchParams.get("minScore") ?? undefined;

  const hasActiveFilters = !!(search || status || dataSource || industry || minScore);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="business-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
          <Input id="business-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Business, website, city..." className="pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={status ?? "any"} onValueChange={(value) => setFilter("status", value === "any" ? undefined : value)}>
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BUSINESS_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source-filter">Source</Label>
          <Select value={dataSource ?? "any"} onValueChange={(value) => setFilter("dataSource", value === "any" ? undefined : value)}>
            <SelectTrigger id="source-filter" className="w-44">
              <SelectValue placeholder="Any source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any source</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BUSINESS_DATA_SOURCE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {industries.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="industry-filter">Industry</Label>
            <Select value={industry ?? "any"} onValueChange={(value) => setFilter("industry", value === "any" ? undefined : value)}>
              <SelectTrigger id="industry-filter" className="w-40">
                <SelectValue placeholder="Any industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any industry</SelectItem>
                {industries.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="min-score-filter">Min. opportunity score</Label>
          <Select value={minScore ?? "any"} onValueChange={(value) => setFilter("minScore", value === "any" ? undefined : value)}>
            <SelectTrigger id="min-score-filter" className="w-36">
              <SelectValue placeholder="Any score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any score</SelectItem>
              <SelectItem value="45">45+ (Medium)</SelectItem>
              <SelectItem value="75">75+ (High)</SelectItem>
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

export { BusinessFiltersToolbar };
