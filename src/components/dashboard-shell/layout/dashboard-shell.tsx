import type { Role } from "@prisma/client";

import { DashboardTitleProvider } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Sidebar } from "@/components/dashboard-shell/layout/sidebar";
import { Topbar } from "@/components/dashboard-shell/layout/topbar";
import type { Notification } from "@/components/dashboard-shell/notifications/notification-data";

export interface DashboardShellProps {
  user: { name?: string | null; email?: string | null; role: Role };
  notifications?: Notification[];
  /** Shown in the topbar until a page overrides it via `<SetPageTitle />` - see dashboard-title-context.tsx. */
  defaultTitle?: string;
  children: React.ReactNode;
  /**
   * Reserved for a future contextual panel (e.g. a lead/project detail
   * view opening beside the main content instead of navigating away).
   * Not used by any page in this phase - present so the shell's contract
   * already accounts for it, per the brief's "right-side optional drawer
   * support (future)." Rendering it is deliberately simple (a fixed
   * column, no Sheet/animation) since no real content exists yet to
   * validate a fuller implementation against.
   */
  rightDrawer?: React.ReactNode;
}

/**
 * The one dashboard layout every role shares - Topbar + Sidebar + a
 * scrollable content column, per the brief's "never duplicate dashboard
 * layouts" rule. Every role-specific difference (which nav items exist,
 * what content renders) is data (a NavigationConfig) or `children`, never
 * a fork of this component. See src/app/(portal)/layout.tsx for how a
 * route group wires a role into this shell.
 */
function DashboardShell({
  user,
  notifications = [],
  defaultTitle = "Dashboard",
  children,
  rightDrawer,
}: DashboardShellProps) {
  return (
    <DashboardTitleProvider defaultTitle={defaultTitle}>
      <div className="bg-background flex h-dvh overflow-hidden">
        <Sidebar role={user.role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} notifications={notifications} />

          <div className="flex min-h-0 flex-1">
            <main id="main-content" className="min-w-0 flex-1 overflow-y-auto">
              {children}
            </main>
            {rightDrawer && (
              <aside className="border-border bg-card hidden w-80 shrink-0 overflow-y-auto border-l xl:block">
                {rightDrawer}
              </aside>
            )}
          </div>
        </div>
      </div>
    </DashboardTitleProvider>
  );
}

export { DashboardShell };
