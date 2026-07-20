"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/operations", label: "Operations", icon: Workflow },
  { href: "/admin/learning", label: "Learning", icon: BookOpen },
  { href: "/admin/mentors", label: "Mentors", icon: UserRound },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

/**
 * Client Component because active-link highlighting needs the current
 * pathname - genuinely required interactivity, not a default. Desktop
 * persistent sidebar per this task's "desktop-first" instruction; on
 * smaller screens it collapses to a top bar rather than a hidden
 * off-canvas panel, since a Founder-only internal tool doesn't need to
 * optimize mobile navigation the way the public marketing site does.
 */
function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-card flex w-full flex-col gap-1 border-b p-4 md:h-full md:w-56 md:border-r md:border-b-0">
      <div className="mb-4 px-2">
        <span className="text-foreground text-lg font-semibold">Stively</span>
        <p className="text-muted-foreground text-xs">Founder CRM</p>
      </div>
      <nav
        className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible"
        aria-label="Dashboard"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { DashboardSidebar };
