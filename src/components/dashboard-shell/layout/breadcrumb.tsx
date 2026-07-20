import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Presentational only - takes an explicit `items` list rather than reading
 * from DashboardTitleContext, so any page can use it (or not) independent
 * of the shell's single dynamic title. Reach for this on pages that are
 * genuinely nested (e.g. a future "Leads / Acme Corp" trail); the shell's
 * Topbar title alone is enough for every flat, one-level dashboard page
 * this phase ships.
 */
function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : "text-muted-foreground"} aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="text-muted-foreground/50 size-3.5" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </nav>
  );
}

export { Breadcrumb };
