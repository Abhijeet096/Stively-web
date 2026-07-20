import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell/layout/dashboard-shell";
import { getNotificationsForUser } from "@/features/notifications/server/queries";
import { toNotificationUIItem } from "@/features/notifications/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The shared shell every role-root portal (Student/Mentor/Client/Company/
 * Intern/Team) renders inside - Topbar + Sidebar + scrollable content, per
 * src/components/dashboard-shell/layout/dashboard-shell.tsx. `requireUser()`
 * is the layout's own defense-in-depth gate (on top of, not instead of,
 * src/proxy.ts's edge middleware); each page additionally calls
 * `requireRole()` for its own specific role.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const notificationRows = await getNotificationsForUser(user.id);
  const notifications = notificationRows.map(toNotificationUIItem);

  return (
    <DashboardShell user={user} notifications={notifications}>
      {children}
    </DashboardShell>
  );
}
