import { LayoutDashboard, Building2 } from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * A Super Admin is a superset of Admin (see src/config/rbac.ts's
 * PROTECTED_ROUTES - SUPER_ADMIN can reach /admin too), so this links into
 * the existing Founder CRM rather than duplicating it. A dedicated
 * cross-portal CEO view (company-wide metrics spanning every role) is
 * real future work - see src/config/navigation/README.md.
 */
export const ceoNavigation: NavigationConfig = [
  { items: [{ label: "Overview", href: "/ceo/dashboard", icon: LayoutDashboard }] },
  {
    title: "Operations",
    items: [{ label: "Open CRM", href: "/admin/dashboard", icon: Building2, external: true }],
  },
];
