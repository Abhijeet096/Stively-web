import { LayoutDashboard } from "lucide-react";

import type { NavigationConfig } from "./types";

/** Single-item placeholder - COMPANY wasn't detailed in this phase's brief; kept consistent with Mentor/Intern/Team's minimal treatment rather than left unstyled. */
export const companyNavigation: NavigationConfig = [
  { items: [{ label: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard }] },
];
