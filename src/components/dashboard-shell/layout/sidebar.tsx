"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Role } from "@prisma/client";

import { Logo } from "@/components/shared/logo";
import { NavItem } from "@/components/dashboard-shell/layout/nav-item";
import { getNavigationForRole } from "@/config/navigation";

export interface SidebarProps {
  role: Role;
}

/**
 * Purely a renderer keyed off a role - it takes the role (a plain,
 * RSC-serializable string) rather than a computed NavigationConfig,
 * because a NavigationConfig's `icon` fields are component functions,
 * which cannot cross the Server-to-Client Component boundary. Resolving
 * `getNavigationForRole` here, client-side, is what lets this component
 * (and the client-only NavItem it renders, which needs `usePathname()`
 * for active-state) receive that data at all. Still has no per-role
 * branching of its own - every role's sidebar is this exact same
 * component, fed a different config - see src/config/navigation for how
 * a new role plugs in.
 */
function Sidebar({ role }: SidebarProps) {
  const navigation = getNavigationForRole(role);
  return (
    <aside className="border-border bg-card hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Dashboard">
        {navigation.map((section, index) => (
          <div key={section.title ?? `section-${index}`} className="flex flex-col gap-1">
            {section.title && (
              <p className="text-muted-foreground px-2.5 pb-1 text-xs font-medium tracking-wide uppercase">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavItem key={item.href + item.label} item={item} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-border border-t p-3">
        <Link
          href="/"
          className="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 ease-out"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}

export { Sidebar };
