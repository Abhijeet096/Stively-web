import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell/layout/dashboard-shell";
import { getNotificationsForUser } from "@/features/notifications/server/queries";
import { toNotificationUIItem } from "@/features/notifications/lib/format";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The real auth gate this layout's previous comment flagged as missing -
 * every route under this group (/admin/*, /ceo/*) now requires ADMIN or
 * SUPER_ADMIN. This is the one file every CRM page passes through, so it's
 * the right (and only necessary) place for the check - individual pages
 * don't each need their own requireRole call.
 *
 * Migrated onto the shared DashboardShell (same as (portal)/layout.tsx) -
 * previously a bare sidebar-only shell with no search/notifications/theme/
 * profile, exactly as src/config/navigation/admin.ts's own comment
 * anticipated ("a swap... not a rewrite"). Individual admin pages keep
 * rendering their own `<h1>` headings inside `children` unchanged; the
 * Topbar's title is a separate, secondary label.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const notificationRows = await getNotificationsForUser(user.id);
  const notifications = notificationRows.map(toNotificationUIItem);

  return (
    <DashboardShell user={user} notifications={notifications} defaultTitle="Founder CRM">
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </DashboardShell>
  );
}

