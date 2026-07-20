import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface WizardProgressProps {
  /** Step titles, in order - the last entry is always "Review". */
  titles: string[];
  currentIndex: number;
}

/**
 * No stepper primitive exists in the design system yet - built here, same
 * "add it in the feature when the design system doesn't have it" call as
 * Phase 4's OfferingToolbar (which needed a Select). Numbered circles +
 * connecting lines, done vs. current vs. upcoming - the Stripe/Linear
 * checkout grammar the brief asks for.
 */
function WizardProgress({ titles, currentIndex }: WizardProgressProps) {
  return (
    <nav aria-label="Application progress" className="w-full">
      <ol className="flex items-center">
        {titles.map((title, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === titles.length - 1;

          return (
            <li key={title} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex flex-col items-center gap-2">
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary border-2",
                    !isDone && !isCurrent && "border-border text-muted-foreground border-2"
                  )}
                >
                  {isDone ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {title}
                </span>
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors duration-200",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { WizardProgress };
