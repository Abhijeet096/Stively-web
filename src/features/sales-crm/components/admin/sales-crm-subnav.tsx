import Link from "next/link";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/admin/sales-crm/dashboard" },
  { label: "Leads", href: "/admin/sales-crm/leads" },
  { label: "Projects", href: "/admin/sales-crm/projects" },
  { label: "Commission", href: "/admin/sales-crm/commission" },
  { label: "Reports", href: "/admin/sales-crm/reports" },
];

/** The admin sidebar only has one flat "Sales CRM" entry (unlike the Sales portal's own multi-item sidebar) - this sub-nav is what actually makes Leads/Projects/Commission/Reports reachable from each other. */
function SalesCrmSubnav({ active }: { active: "Overview" | "Leads" | "Projects" | "Commission" | "Reports" }) {
  return (
    <nav className="border-border flex gap-1 border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab.label === active
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export { SalesCrmSubnav };
