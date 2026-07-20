import { LayoutDashboard } from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * Exists so the role→navigation registry (src/config/navigation/index.ts)
 * is total over every Role value - the architecture story ("a future role
 * needs only a config file") only holds if every existing role already has
 * one, including this one. NOT wired into the live Founder CRM: that
 * dashboard already has its own working sidebar
 * (src/components/dashboard/sidebar.tsx, real Leads/Students/Businesses/
 * Reports/Settings routes under /admin) built in an earlier phase, and
 * this phase's brief explicitly excludes CRM work. Migrating the CRM
 * sidebar onto this config system later is a swap of that one file's
 * hardcoded NAV_ITEMS array for `adminNavigation` - not a rewrite.
 */
export const adminNavigation: NavigationConfig = [
  { items: [{ label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard }] },
];
