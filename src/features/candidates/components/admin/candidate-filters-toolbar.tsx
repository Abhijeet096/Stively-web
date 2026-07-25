"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { InterviewStatus, Recommendation } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCandidateFilters } from "../../hooks/use-candidate-filters";
import { INTERVIEW_STATUS_LABEL, RECOMMENDATION_LABEL } from "@/features/interviews/lib/report-labels";

const STATUSES: InterviewStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"];
const RECOMMENDATIONS: Recommendation[] = ["STRONG_HIRE", "HIRE", "HOLD", "REJECT"];

export interface CandidateFiltersToolbarProps {
  jobs: { id: string; title: string }[];
}

/** Same instant, URL-driven Select pattern as operations/components/operation-filters-toolbar.tsx. */
function CandidateFiltersToolbar({ jobs }: CandidateFiltersToolbarProps) {
  const { searchParams, setFilter, clearFilters } = useCandidateFilters();
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

  const jobId = searchParams.get("jobId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const recommendation = searchParams.get("recommendation") ?? undefined;

  const hasActiveFilters = !!(search || jobId || status || recommendation);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="candidate-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="candidate-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or email..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-filter">Position</Label>
          <Select value={jobId ?? "any"} onValueChange={(value) => setFilter("jobId", value === "any" ? undefined : value)}>
            <SelectTrigger id="job-filter" className="w-44">
              <SelectValue placeholder="Any position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any position</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-filter">Interview status</Label>
          <Select value={status ?? "any"} onValueChange={(value) => setFilter("status", value === "any" ? undefined : value)}>
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {INTERVIEW_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recommendation-filter">Recommendation</Label>
          <Select
            value={recommendation ?? "any"}
            onValueChange={(value) => setFilter("recommendation", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="recommendation-filter" className="w-40">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {RECOMMENDATIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {RECOMMENDATION_LABEL[r]}
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

export { CandidateFiltersToolbar };
