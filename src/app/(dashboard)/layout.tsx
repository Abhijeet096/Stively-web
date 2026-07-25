import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The real auth gate this layout's previous comment flagged as missing -
 * every route under this group (/admin/*, /ceo/*) now requires ADMIN or
 * SUPER_ADMIN. This is the one file every CRM page passes through, so it's
 * the right (and only necessary) place for the check - individual pages
 * don't each need their own requireRole call.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN", "SUPER_ADMIN");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <main id="main-content" className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );

}

