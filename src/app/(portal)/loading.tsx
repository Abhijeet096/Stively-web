import { LoadingSkeleton } from "@/components/dashboard-shell/widgets/loading-skeleton";

/**
 * Next.js's `loading.tsx` convention - wraps every page under (portal)
 * (Student/Mentor/Client/Company/Intern/Team, since they all share this one
 * route-group layout) in a Suspense boundary, shown instantly on navigation
 * while the destination page's data loads. Fixes the "did my tap even
 * register?" feeling on a slower connection (mobile especially) - until
 * now, nothing rendered at all during that gap. Reuses LoadingSkeleton
 * (src/components/dashboard-shell/widgets/loading-skeleton.tsx), which was
 * already shape-matched to this shell's widgets specifically anticipating
 * a file like this one.
 */
export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <LoadingSkeleton variant="stat" count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
      <LoadingSkeleton variant="card" count={2} />
    </div>
  );
}
