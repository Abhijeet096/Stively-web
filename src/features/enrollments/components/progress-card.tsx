import { TrendingUp } from "lucide-react";

import { StatCard } from "@/components/dashboard-shell/widgets/stat-card";

/** Wraps the existing StatCard widget (src/components/dashboard-shell/widgets/stat-card.tsx) with a simple progress bar - not a new primitive, just enough visual richness for a percentage to read as "progress" rather than a bare number. */
function ProgressCard({ progressPercentage }: { progressPercentage: number }) {
  const clamped = Math.max(0, Math.min(100, progressPercentage));

  return (
    <div className="flex flex-col gap-3">
      <StatCard label="Progress" value={`${clamped}%`} icon={TrendingUp} />
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export { ProgressCard };
