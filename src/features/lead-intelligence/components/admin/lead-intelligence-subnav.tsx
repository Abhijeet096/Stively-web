import Link from "next/link";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Dashboard", href: "/admin/lead-intelligence/dashboard" },
  { label: "Businesses", href: "/admin/lead-intelligence/businesses" },
  { label: "Discover", href: "/admin/lead-intelligence/discover" },
  { label: "Scoring", href: "/admin/lead-intelligence/scoring-config" },
  { label: "Runs", href: "/admin/lead-intelligence/runs" },
];

/** Same "one flat sidebar entry, sub-nav does the rest" pattern as sales-crm's SalesCrmSubnav. */
function LeadIntelligenceSubnav({ active }: { active: "Dashboard" | "Businesses" | "Discover" | "Scoring" | "Runs" }) {
  return (
    <nav className="border-border flex gap-1 border-b overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
            tab.label === active ? "border-primary text-foreground" : "text-muted-foreground hover:text-foreground border-transparent"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export { LeadIntelligenceSubnav };
