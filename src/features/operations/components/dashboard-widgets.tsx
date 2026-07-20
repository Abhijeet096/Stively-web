import Link from "next/link";
import { ClipboardList, Eye, Wallet, CalendarClock, ListTodo } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatOperationNumber } from "../lib/operation-number";
import { ACTIVITY_LABEL } from "../lib/activity-labels";
import type { OperationsDashboardStats } from "../server/queries";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Every number here comes from getOperationsDashboardStats() (../server/queries.ts) - no mocked statistics, same discipline the existing /admin/dashboard already commits to for Leads. */
function OperationsDashboardWidgets({ stats }: { stats: OperationsDashboardStats }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-4">
        <KpiCard label="Today's Requests" value={stats.todaysRequests} icon={ClipboardList} />
        <KpiCard label="Pending Reviews" value={stats.pendingReviews} icon={Eye} />
        <KpiCard label="Pending Payments" value={stats.pendingPayments} icon={Wallet} tone="destructive" />
        <KpiCard label="Today's Meetings" value={stats.todaysMeetings} icon={CalendarClock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              stats.recentOrders.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/operations/${item.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="text-foreground truncate">{item.order?.offering.title}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {formatOperationNumber(item.sequence)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing yet.</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col gap-0.5">
                  <span className="text-foreground text-sm">
                    {ACTIVITY_LABEL[activity.type]}
                    {activity.performedBy && ` · ${activity.performedBy.name}`}
                  </span>
                  <span className="text-muted-foreground text-xs">{formatDateTime(activity.createdAt)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center gap-2">
            <ListTodo className="text-muted-foreground size-4" aria-hidden="true" />
            <CardTitle>Upcoming tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.upcomingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing due soon.</p>
            ) : (
              stats.upcomingTasks.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/operations/${item.id}`}
                  className="flex items-center justify-between gap-2 text-sm hover:underline"
                >
                  <span className="text-foreground truncate">{item.nextAction ?? "Follow up"}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {item.dueDate && new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(item.dueDate)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { OperationsDashboardWidgets };
