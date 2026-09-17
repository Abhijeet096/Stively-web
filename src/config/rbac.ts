import type { Role } from "@prisma/client";

/**
 * The single source of truth for "where does this role land after login"
 * and "which roles may reach this route prefix." src/proxy.ts (edge
 * middleware) and src/lib/session.ts (`requireRole`, for defense-in-depth
 * inside pages) both read this file rather than each hard-coding their own
 * copy of the role map - a new portal is one entry in each object below
 * plus a route folder, not a change to the enforcement logic itself.
 */
export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  MENTOR: "/mentor/dashboard",
  CLIENT: "/client/dashboard",
  COMPANY: "/company/dashboard",
  INTERN: "/intern/dashboard",
  TEAM_MEMBER: "/team/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/ceo/dashboard",
  SALES: "/sales/dashboard",
};

/** Human-readable role labels, shared by ProfileDropdown, the dashboard shell's role badge, and anywhere else a Role enum value needs to render as text. */
export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  MENTOR: "Mentor",
  CLIENT: "Client",
  COMPANY: "Company",
  INTERN: "Intern",
  TEAM_MEMBER: "Team member",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  SALES: "Sales",
};

export interface ProtectedRoute {
  /** Matched via `pathname.startsWith(prefix)`. */
  prefix: string;
  roles: Role[];
}

/**
 * Every private route prefix and who may enter it. SUPER_ADMIN can reach
 * `/admin` too (a Super Admin is a superset of Admin, not a sibling), but
 * ADMIN cannot reach `/ceo` - see the brief's explicit "Admin can manage
 * almost everything, Super Admin can manage absolutely everything."
 */
export const PROTECTED_ROUTES: ProtectedRoute[] = [
  { prefix: "/student", roles: ["STUDENT"] },
  { prefix: "/mentor", roles: ["MENTOR"] },
  { prefix: "/client", roles: ["CLIENT"] },
  { prefix: "/company", roles: ["COMPANY"] },
  { prefix: "/intern", roles: ["INTERN"] },
  { prefix: "/team", roles: ["TEAM_MEMBER"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/ceo", roles: ["SUPER_ADMIN"] },
  { prefix: "/sales", roles: ["SALES"] },
];

/**
 * Pages a signed-in user gets bounced off of, straight to their own
 * dashboard (ROLE_HOME) - the auth-flow pages, and now the marketing
 * homepage too: a returning logged-in visitor lands on "/" and is sent
 * straight to where they actually work instead of the generic pitch page.
 * Deliberately just "/" itself (exact match, see proxy.ts's isGuestOnlyRoute
 * - the `startsWith(`${route}/`)` half is a no-op for "/"), not every
 * marketing page - a logged-in user browsing /pricing or /services to
 * check something, or sharing a link, should still see it normally.
 */
export const GUEST_ONLY_ROUTES = ["/login", "/register", "/"];

export function findProtectedRoute(pathname: string): ProtectedRoute | undefined {
  return PROTECTED_ROUTES.find((route) => pathname.startsWith(route.prefix));
}

export function canAccess(role: Role, pathname: string): boolean {
  const route = findProtectedRoute(pathname);
  if (!route) return true; // not a protected prefix - not this map's concern
  return route.roles.includes(role);
}
