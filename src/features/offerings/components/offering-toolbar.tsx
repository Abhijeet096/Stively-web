"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { OfferingAudience, Difficulty, Mode } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOfferingFilters } from "../hooks/use-offering-filters";
import { AUDIENCE_LABEL, DIFFICULTY_LABEL, MODE_LABEL } from "../lib/labels";
import { PRICE_BUCKETS, PRICE_BUCKET_LABEL } from "../lib/price-buckets";
import { OFFERING_SORTS, SORT_LABEL } from "../validation/offering-filters";

/**
 * Search + Audience/Difficulty/Mode/Price/Sort, all instant and URL-driven
 * via useOfferingFilters - no submit button, no full-page reload feel.
 * Category isn't a field here: CategoryNav (pills into /offerings/[slug])
 * already owns category selection, so this toolbar stays scoped to the
 * filters that make sense *within* a category page too.
 */
function OfferingToolbar() {
  const { searchParams, setFilter, clearFilters } = useOfferingFilters();
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = React.useState(urlQuery);

  // Resets the local input when the URL's `q` changes from outside this
  // component (Clear filters, browser back/forward) - adjusted during
  // render per React's "adjusting state when a prop changes" pattern
  // (react.dev), not inside an effect, so it doesn't cascade an extra render.
  const [lastUrlQuery, setLastUrlQuery] = React.useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== urlQuery) {
        setFilter("q", search.trim() || undefined);
      }
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const audience = searchParams.get("audience") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const mode = searchParams.get("mode") ?? undefined;
  const price = searchParams.get("price") ?? undefined;
  const sort = searchParams.get("sort") ?? "featured";

  const hasActiveFilters = !!(search || audience || difficulty || mode || price);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="offering-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="offering-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search offerings..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audience-filter">Audience</Label>
          <Select
            value={audience ?? "any"}
            onValueChange={(value) => setFilter("audience", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="audience-filter" className="w-40">
              <SelectValue placeholder="Any audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any audience</SelectItem>
              {Object.values(OfferingAudience).map((value) => (
                <SelectItem key={value} value={value}>
                  {AUDIENCE_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty-filter">Difficulty</Label>
          <Select
            value={difficulty ?? "any"}
            onValueChange={(value) => setFilter("difficulty", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="difficulty-filter" className="w-40">
              <SelectValue placeholder="Any difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any difficulty</SelectItem>
              {Object.values(Difficulty).map((value) => (
                <SelectItem key={value} value={value}>
                  {DIFFICULTY_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mode-filter">Mode</Label>
          <Select
            value={mode ?? "any"}
            onValueChange={(value) => setFilter("mode", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="mode-filter" className="w-36">
              <SelectValue placeholder="Any mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any mode</SelectItem>
              {Object.values(Mode).map((value) => (
                <SelectItem key={value} value={value}>
                  {MODE_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price-filter">Price</Label>
          <Select
            value={price ?? "any"}
            onValueChange={(value) => setFilter("price", value === "any" ? undefined : value)}
          >
            <SelectTrigger id="price-filter" className="w-40">
              <SelectValue placeholder="Any price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              {PRICE_BUCKETS.map((bucket) => (
                <SelectItem key={bucket} value={bucket}>
                  {PRICE_BUCKET_LABEL[bucket]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sort-filter">Sort by</Label>
          <Select value={sort} onValueChange={(value) => setFilter("sort", value)}>
            <SelectTrigger id="sort-filter" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OFFERING_SORTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {SORT_LABEL[value]}
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

export { OfferingToolbar };
