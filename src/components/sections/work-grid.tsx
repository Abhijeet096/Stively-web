"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { PortfolioItem, PortfolioCategory } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { PortfolioCard, PORTFOLIO_CATEGORY_LABEL } from "@/components/sections/portfolio-showcase";

type CategoryFilter = PortfolioCategory | "ALL";
type WorkTypeFilter = "ALL" | "CLIENT" | "CONCEPT";

export interface WorkGridProps {
  items: PortfolioItem[];
}

/**
 * The one Client Component the /work page needs - everything else on that
 * page stays a Server Component (same "Client Components only when
 * necessary" discipline as ContactForm). Filtering happens entirely
 * client-side against the already-fetched list: the item count here is a
 * portfolio's worth (dozens, not thousands), so a network round-trip per
 * filter click would be slower than just re-rendering, not faster.
 */
function WorkGrid({ items }: WorkGridProps) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<CategoryFilter>("ALL");
  const [workType, setWorkType] = React.useState<WorkTypeFilter>("ALL");

  const presentCategories = React.useMemo(() => {
    const seen = new Set<PortfolioCategory>();
    for (const item of items) seen.add(item.category);
    return Array.from(seen);
  }, [items]);

  const hasBothWorkTypes = React.useMemo(
    () => items.some((item) => item.clientName) && items.some((item) => !item.clientName),
    [items]
  );

  const visibleItems = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "ALL" && item.category !== category) return false;
      if (workType === "CLIENT" && !item.clientName) return false;
      if (workType === "CONCEPT" && item.clientName) return false;
      if (query) {
        const haystack = [item.title, item.summary, item.clientName, item.industry, ...item.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, category, workType, search]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search projects"
          />
        </div>

        {presentCategories.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <Button
              type="button"
              variant={category === "ALL" ? "primary" : "outline"}
              size="sm"
              onClick={() => setCategory("ALL")}
              aria-pressed={category === "ALL"}
            >
              All work
            </Button>
            {presentCategories.map((c) => (
              <Button
                key={c}
                type="button"
                variant={category === c ? "primary" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                {PORTFOLIO_CATEGORY_LABEL[c]}
              </Button>
            ))}
          </div>
        )}

        {hasBothWorkTypes && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by project type">
            {(["ALL", "CLIENT", "CONCEPT"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={workType === value ? "primary" : "outline"}
                size="sm"
                onClick={() => setWorkType(value)}
                aria-pressed={workType === value}
              >
                {value === "ALL" ? "All types" : value === "CLIENT" ? "Client Work" : "Concepts"}
              </Button>
            ))}
          </div>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <p className="text-muted-foreground text-sm" role="status">
          No projects match your search.
        </p>
      ) : (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
          aria-label={`Showing ${visibleItems.length} project${visibleItems.length === 1 ? "" : "s"}`}
        >
          {visibleItems.map((item, index) => (
            <Reveal key={item.id} delay={index * 60} className="h-full">
              <PortfolioCard item={item} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export { WorkGrid };
