import { LayoutDashboard } from "lucide-react";

import type { NavigationConfig } from "./types";

/** Single-item placeholder - see company.ts's note; same treatment for TEAM_MEMBER. */
export const teamNavigation: NavigationConfig = [
  { items: [{ label: "Dashboard", href: "/team/dashboard", icon: LayoutDashboard }] },
];
