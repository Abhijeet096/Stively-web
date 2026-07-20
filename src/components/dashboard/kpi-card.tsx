import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Tints the icon to match what the number means - a "Lost" count and a "Converted" count shouldn't read as the same neutral stat. */
  tone?: "neutral" | "success" | "destructive";
}

const TONE_CLASSNAME: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

function KpiCard({ label, value, icon: Icon, tone = "neutral" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            TONE_CLASSNAME[tone]
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { KpiCard };
