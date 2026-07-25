import { EmptyState } from "@/components/sections/empty-state";
import { BarChart3 } from "lucide-react";
import type { ChartPoint } from "../../server/dashboard-queries";

/**
 * One small, dependency-free horizontal bar chart, reused for all three
 * overview charts (Daily Interviews, Hiring Funnel, Score Distribution).
 * These are simple label/value bar visualizations - not worth pulling in a
 * charting library for, matching this codebase's general preference for
 * hand-rolled UI over new dependencies when the need is this contained.
 */
function BarChart({ data, emptyLabel }: { data: ChartPoint[]; emptyLabel: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <EmptyState icon={BarChart3} title="No data yet" description={emptyLabel} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((point) => (
        <div key={point.label} className="flex items-center gap-3">
          <span className="text-muted-foreground w-20 shrink-0 text-xs">{point.label}</span>
          <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
          <span className="text-foreground w-8 shrink-0 text-right text-xs font-medium tabular-nums">
            {point.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export { BarChart };
