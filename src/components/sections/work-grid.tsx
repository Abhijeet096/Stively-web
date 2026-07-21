"use client";

import * as React from "react";
import type { PortfolioItem, PortfolioCategory } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { PortfolioCard, PORTFOLIO_CATEGORY_LABEL } from "@/components/sections/portfolio-showcase";

type FilterValue = PortfolioCategory | "ALL";

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
  const [filter, setFilter] = React.useState<FilterValue>("ALL");

  const presentCategories = React.useMemo(() => {
    const seen = new Set<PortfolioCategory>();
    for (const item of items) seen.add(item.category);
    return Array.from(seen);
  }, [items]);

  const visibleItems = filter === "ALL" ? items : items.filter((item) => item.category === filter);

  return (
    <div className="flex flex-col gap-8">
      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <Button
            type="button"
            variant={filter === "ALL" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
            aria-pressed={filter === "ALL"}
          >
            All work
          </Button>
          {presentCategories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={filter === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
            >
              {PORTFOLIO_CATEGORY_LABEL[category]}
            </Button>
          ))}
        </div>
      )}

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
    </div>
  );
}

export { WorkGrid };
