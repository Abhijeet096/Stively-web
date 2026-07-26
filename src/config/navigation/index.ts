import type { Role } from "@prisma/client";

import type { NavigationConfig } from "./types";
import { studentNavigation } from "./student";
import { businessNavigation } from "./business";
import { mentorNavigation } from "./mentor";
import { companyNavigation } from "./company";
import { internNavigation } from "./intern";
import { teamNavigation } from "./team";
import { adminNavigation } from "./admin";
import { ceoNavigation } from "./ceo";
import { salesNavigation } from "./sales";

/**
 * The one place a Role maps to a sidebar. `Record<Role, ...>` (not
 * `Partial<...>`) is intentional - TypeScript enforces that every Role
 * enum value has a navigation config the moment it's added to
 * prisma/schema.prisma, so a new role can never silently ship with no
 * sidebar. Adding a role is: one Prisma enum value, one new file beside
 * this one exporting a `NavigationConfig`, and one line here.
 */
const ROLE_NAVIGATION: Record<Role, NavigationConfig> = {
  STUDENT: studentNavigation,
  CLIENT: businessNavigation,
  MENTOR: mentorNavigation,
  COMPANY: companyNavigation,
  INTERN: internNavigation,
  TEAM_MEMBER: teamNavigation,
  ADMIN: adminNavigation,
  SUPER_ADMIN: ceoNavigation,
  SALES: salesNavigation,
};

export function getNavigationForRole(role: Role): NavigationConfig {
  return ROLE_NAVIGATION[role];
}

export type { NavItem, NavSection, NavigationConfig } from "./types";
