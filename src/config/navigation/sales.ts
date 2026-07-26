import { LayoutDashboard, Building2, Briefcase, CalendarClock, ListChecks, IndianRupee } from "lucide-react";

import type { NavigationConfig } from "./types";

/** Sales CRM portal - a Sales Executive's own dashboard, leads, projects, follow-ups, tasks, and commission. Scoped to their own data via resolveSalesCrmViewer; a Sales Manager sees the whole team through the same pages. */
export const salesNavigation: NavigationConfig = [
  {
    items: [{ label: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Pipeline",
    items: [
      { label: "My Leads", href: "/sales/leads", icon: Building2 },
      { label: "Projects", href: "/sales/projects", icon: Briefcase },
      { label: "Follow-ups", href: "/sales/follow-ups", icon: CalendarClock },
      { label: "Tasks", href: "/sales/tasks", icon: ListChecks },
    ],
  },
  {
    items: [{ label: "Commission", href: "/sales/commission", icon: IndianRupee }],
  },
];
