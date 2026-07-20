import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard-shell/widgets/dashboard-card";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** e.g. "+12% this month" - purely presentational, no trend computation happens here. */
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  className?: string;
}

const TREND_TONE_CLASS: Record<NonNullable<StatCardProps["trendTone"]>, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

/**
 * A single metric tile - deliberately quiet (hairline border, no
 * gradient fill) per this phase's "no colorful gradients everywhere"
 * design constraint. No live data source feeds this yet anywhere it's
 * used in this phase (every role dashboard here is pre-enrollment /
 * pre-project); it exists as the component future analytics/CRM work
 * plugs numbers into.
 */
function StatCard({ label, value, icon: Icon, trend, trendTone = "neutral", className }: StatCardProps) {
  return (
    <DashboardCard padding="compact" className={cn("flex-row items-center gap-4", className)}>
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <p className="text-foreground text-2xl font-semibold tabular-nums">{value}</p>
        {trend && <p className={cn("text-xs font-medium", TREND_TONE_CLASS[trendTone])}>{trend}</p>}
      </div>
    </DashboardCard>
  );
}

export { StatCard };
