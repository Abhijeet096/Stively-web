import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { getFollowUpBuckets } from "@/features/sales-crm/server/queries";
import { FollowUpBucketSection } from "@/features/sales-crm/components/sales/follow-up-bucket-section";

export const metadata: Metadata = { title: "Follow-ups" };

export default async function SalesFollowUpsPage() {
  const user = await requireRole("SALES");
  const viewer = await resolveSalesCrmViewer(user.id, user.role);
  const buckets = await getFollowUpBuckets(viewer);

  return (
    <>
      <SetPageTitle title="Follow-ups" />
      <Container className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Follow-ups</h1>
          <p className="text-muted-foreground text-sm">Overdue, today, and upcoming - across every lead assigned to you.</p>
        </div>

        <FollowUpBucketSection title="Overdue" followUps={buckets.overdue} />
        <FollowUpBucketSection title="Today" followUps={buckets.today} />
        <FollowUpBucketSection title="Upcoming" followUps={buckets.upcoming} />
      </Container>
    </>
  );
}
