import Link from "next/link";
import type { OfferingCategory } from "@prisma/client";

import { cn } from "@/lib/utils";
import { CATEGORY_SLUG } from "../lib/category-slug";
import { CATEGORY_LABEL } from "../lib/labels";

const ALL_CATEGORIES = Object.keys(CATEGORY_SLUG) as OfferingCategory[];

/** Pills into /offerings/[categorySlug] - every URL comes from CATEGORY_SLUG, never hardcoded. */
function CategoryNav({ activeCategory }: { activeCategory?: OfferingCategory }) {
  return (
    <nav aria-label="Browse by category" className="flex flex-wrap gap-2">
      <Link
        href="/offerings"
        className={cn(
          "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
          !activeCategory
            ? "border-primary bg-primary/10 text-primary"
            : "border-input text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground"
        )}
      >
        All
      </Link>
      {ALL_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/offerings/${CATEGORY_SLUG[category]}`}
          aria-current={activeCategory === category ? "page" : undefined}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
            activeCategory === category
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground"
          )}
        >
          {CATEGORY_LABEL[category]}
        </Link>
      ))}
    </nav>
  );
}

export { CategoryNav };
