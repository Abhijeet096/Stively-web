import { LoadingSkeleton } from "@/components/dashboard-shell/widgets/loading-skeleton";

/** Same fix as (portal)/loading.tsx, for /admin/* and /ceo/* - see that file's comment. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6">
      <LoadingSkeleton variant="stat" count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
      <LoadingSkeleton variant="card" count={2} />
    </div>
  );
}
