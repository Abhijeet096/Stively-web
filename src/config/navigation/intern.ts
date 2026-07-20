import { LayoutDashboard } from "lucide-react";

import type { NavigationConfig } from "./types";

/** Single-item placeholder - see company.ts's note; same treatment for INTERN. */
export const internNavigation: NavigationConfig = [
  { items: [{ label: "Dashboard", href: "/intern/dashboard", icon: LayoutDashboard }] },
];
