import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  /** "stat" mirrors StatCard, "card" mirrors a generic DashboardCard block, "list" mirrors RecentActivity's rows. */
  variant?: "stat" | "card" | "list";
  count?: number;
  className?: string;
}

/**
 * Shape-matched skeletons for the three widget shapes this phase ships
 * (StatCard, DashboardCard, RecentActivity) - built on the existing
 * `Skeleton` primitive (src/components/ui/skeleton.tsx), not a new
 * shimmer implementation. Every dashboard page in this phase fetches its
 * own data server-side (no client loading state exists yet to attach
 * these to) - they're included now as the shape a future `loading.tsx`
 * or client-fetched section reaches for, per design-system.md §21's
 * "skeletons must match the real content's shape" rule.
 */
function LoadingSkeleton({ variant = "card", count = 1, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShape key={index} variant={variant} />
      ))}
    </div>
  );
}

function SkeletonShape({ variant }: { variant: NonNullable<LoadingSkeletonProps["variant"]> }) {
  if (variant === "stat") {
    return (
      <div className="border-border flex items-center gap-4 rounded-xl border p-4">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="border-border flex flex-col gap-0 divide-y rounded-xl border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-5">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export { LoadingSkeleton };
