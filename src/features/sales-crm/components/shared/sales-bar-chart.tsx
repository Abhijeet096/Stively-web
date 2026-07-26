import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import type { ChartPoint } from "../../server/dashboard-charts";

/**
 * Same dependency-free "CSS bar chart" pattern as the AI Interview
 * Platform's BarChart (src/features/interviews/components/admin/bar-chart.tsx)
 * - plain divs with a dynamic width percentage, not a charting library or
 * SVG. formatValue is optional so money charts (Revenue, Commission) can
 * render "₹12,000" instead of a bare "12000".
 */
function SalesBarChart({
  data,
  emptyLabel,
  formatValue = (v: number) => String(v),
}: {
  data: ChartPoint[];
  emptyLabel: string;
  formatValue?: (value: number) => string;
}) {
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
          <span className="text-foreground w-16 shrink-0 text-right text-xs font-medium tabular-nums">
            {formatValue(point.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export { SalesBarChart };
