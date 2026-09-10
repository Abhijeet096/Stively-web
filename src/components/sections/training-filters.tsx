import Link from "next/link";
import type { Difficulty, Mode } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LEVEL_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
  { value: "HYBRID", label: "Hybrid" },
];

export interface TrainingFiltersProps {
  search?: string;
  level?: string;
  mode?: string;
}

/**
 * No Select primitive exists in the design system yet (flagged as a
 * backlog item back in Phase E, for the Mentor application form) - these
 * native <select> elements are styled to match Input's border/focus
 * language as closely as reasonable without one. Building a full Select
 * primitive is out of scope for "only build the Training Listing page."
 */
const nativeSelectClassName =
  "h-10 rounded-md border border-input bg-background px-3 text-sm outline-none " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * A native <form method="get">, not a client component - submitting it
 * navigates the browser to /training?q=...&level=...&mode=...&duration=...,
 * which is simultaneously the simplest implementation, fully accessible
 * with zero JS, and "preserve URL query parameters" for free. There's no
 * `page` field, so any filter submission naturally lands back on page 1.
 */
function TrainingFilters({ search, level, mode }: TrainingFiltersProps) {
  return (
    <form method="get" action="/training" className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          type="text"
          defaultValue={search}
          placeholder="Search programs..."
          className="w-48"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="level">Level</Label>
        <select
          id="level"
          name="level"
          defaultValue={level ?? ""}
          className={nativeSelectClassName}
        >
          <option value="">Any level</option>
          {LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mode">Mode</Label>
        <select id="mode" name="mode" defaultValue={mode ?? ""} className={nativeSelectClassName}>
          <option value="">Any mode</option>
          {MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Apply filters</Button>

      {(search || level || mode) && (
        <Button type="button" variant="ghost" asChild>
          <Link href="/training">Clear filters</Link>
        </Button>
      )}
    </form>
  );
}

export { TrainingFilters };
