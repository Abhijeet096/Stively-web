import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import type { ChartPoint } from "../../server/dashboard-charts";

/** Same dependency-free "CSS bar chart" pattern used by every other feature's dashboard in this codebase (e.g. sales-crm's SalesBarChart) - plain divs, no charting library. */
function LeadIntelligenceBarChart({ data, emptyLabel }: { data: ChartPoint[]; emptyLabel: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <EmptyState icon={BarChart3} title="No data yet" description={emptyLabel} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((point) => (
        <div key={point.label} className="flex items-center gap-3">
          <span className="text-muted-foreground w-32 shrink-0 text-xs">{point.label}</span>
          <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(point.value / max) * 100}%` }} />
          </div>
          <span className="text-foreground w-10 shrink-0 text-right text-xs font-medium tabular-nums">{point.value}</span>
        </div>
      ))}
    </div>
  );
}

export { LeadIntelligenceBarChart };
