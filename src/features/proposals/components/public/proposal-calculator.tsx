"use client";

import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { ProposalCalculatorContent } from "../../lib/content-types";
import { computePaymentSchedule } from "../../server/roi-calculator";

/**
 * The interactive-calculator alternative to fixed packages (ProposalPricing)
 * - a proposal uses one pricing mode or the other, see
 * ProposalCalculatorContent's schema comment. Selection here is purely
 * exploratory for this page view (not persisted) - the same live-toggle
 * component appears again inside the Accept dialog (proposal-response-
 * panel.tsx) where a selection actually gets submitted.
 */
function ProposalCalculator({ calculator }: { calculator: ProposalCalculatorContent | null }) {
  const items = calculator?.items ?? [];
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(items.filter((i) => i.defaultSelected).map((i) => i.id)));

  if (items.length === 0) return null;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const total = items.filter((i) => selectedIds.has(i.id)).reduce((sum, i) => sum + i.priceAmount, 0);
  const schedule = calculator!.paymentMilestones.length > 0 && total > 0 ? computePaymentSchedule(total, calculator!.paymentMilestones) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-primary text-xs font-semibold tracking-wide uppercase">Pricing calculator</span>
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">Build your package</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${isSelected ? "bg-primary/5 border-primary/40" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    {isSelected ? (
                      <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">{item.label}</span>
                      {item.description && <span className="text-muted-foreground text-xs">{item.description}</span>}
                    </div>
                  </div>
                  <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">{formatPrice(item.priceAmount)}</span>
                </button>
              );
            })}
          </div>

          <div className="border-border flex items-center justify-between border-t pt-4">
            <span className="text-foreground text-sm font-medium">Total</span>
            <span className="text-foreground text-2xl font-bold tabular-nums">{formatPrice(total)}</span>
          </div>

          {schedule.length > 0 && (
            <div className="border-border flex flex-col gap-1 border-t pt-3">
              <span className="text-muted-foreground text-xs font-medium uppercase">Payment schedule</span>
              {schedule.map((m, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {m.label} ({m.percent}%)
                  </span>
                  <span className="text-foreground font-medium">{formatPrice(m.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ProposalCalculator };
