import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, TrendingUp, ListTodo, ClipboardList, ShoppingBag, Users2 } from "lucide-react";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { resolveOperationsViewer } from "@/features/operations/server/rbac";
import { getOperationsDashboardStats } from "@/features/operations/server/queries";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";

export const metadata: Metadata = { title: "CEO Dashboard" };

/**
 * CEO widget prep (Phase 7) - Pending Work/Requests/Orders/Team are real
 * queries, no mocked statistics (same discipline as every other dashboard
 * in this codebase). Revenue and Conversion Rate are honest "Coming soon"
 * placeholders, not fabricated numbers - both genuinely need payment/funnel
 * analytics infrastructure that doesn't exist yet (see the brief's "No
 * analytics yet. Architecture only." for this section).
 */
export default async function CeoDashboardPage() {
  const user = await requireRole("SUPER_ADMIN");
  const viewer = await resolveOperationsViewer(user.id, user.role);

  const [stats, openRequests, paidOrders, teamMemberCount] = await Promise.all([
    getOperationsDashboardStats(viewer),
    prisma.offeringRequest.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "COUNSELLING_SCHEDULED", "WAITING_FOR_PAYMENT", "APPROVED"] } },
    }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.teamMember.count(),
  ]);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Welcome, {user.name ?? "there"}
          </h1>
          <p className="text-muted-foreground text-sm">Super Admin - full access across every team.</p>
        </div>
        <Button asChild>
          <Link href="/admin/operations">Open Operations</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Pending Work" value={stats.pendingReviews + stats.pendingPayments} icon={ListTodo} />
        <KpiCard label="Open Requests" value={openRequests} icon={ClipboardList} />
        <KpiCard label="Paid Orders" value={paidOrders} icon={ShoppingBag} tone="success" />
        <KpiCard label="Team Members" value={teamMemberCount} icon={Users2} />
        <ComingSoonKpi label="Revenue" icon={Wallet} />
        <ComingSoonKpi label="Conversion Rate" icon={TrendingUp} />
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Founder CRM</CardTitle>
          <CardDescription>Leads, students, and businesses still live in the CRM.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/dashboard">Open the CRM</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ComingSoonKpi({ label, icon: Icon }: { label: string; icon: typeof Wallet }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm font-medium">Coming soon</span>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
