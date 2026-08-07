import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Workflow,
  BookOpen,
  UserRound,
  BarChart3,
  Settings,
  Mic,
  Briefcase,
  Radar,
  GalleryHorizontalEnd,
} from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * The real Founder CRM nav - moved here from the old standalone
 * src/components/dashboard/sidebar.tsx's hardcoded NAV_ITEMS array, exactly
 * as that file's own comment anticipated ("a swap... not a rewrite") once
 * (dashboard)/layout.tsx migrated onto the shared DashboardShell so ADMIN
 * gets the same Topbar (search/notifications/theme/profile) every other
 * role already has, instead of a bare sidebar with none of it.
 */
export const adminNavigation: NavigationConfig = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/admin/leads", icon: Users },
      { label: "Sales CRM", href: "/admin/sales-crm/dashboard", icon: Briefcase },
      { label: "Lead Intelligence", href: "/admin/lead-intelligence/dashboard", icon: Radar },
      { label: "Operations", href: "/admin/operations", icon: Workflow },
      { label: "Interviews", href: "/admin/interviews", icon: Mic },
      { label: "Learning", href: "/admin/learning", icon: BookOpen },
      { label: "Mentors", href: "/admin/mentors", icon: UserRound },
      { label: "Portfolio", href: "/admin/portfolio", icon: GalleryHorizontalEnd },
      { label: "Students", href: "/admin/students", icon: GraduationCap },
      { label: "Businesses", href: "/admin/businesses", icon: Building2 },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
