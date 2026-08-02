"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface IntegrityWarningModalProps {
  violationCount: number;
  onResume: () => void;
}

/**
 * Non-dismissible full-screen overlay - deliberately not the Dialog
 * primitive (which closes on Escape/outside-click, exactly the two things
 * that must NOT end this warning). The underlying question/recording state
 * stays frozen but visible underneath, matching how the "Still there?"
 * recovery path already pauses rather than replaces the screen.
 */
function IntegrityWarningModal({ violationCount, onResume }: IntegrityWarningModalProps) {
  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="border-destructive/30 bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-xl">
        <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <h2 className="font-display text-foreground text-lg font-semibold">You left the interview window</h2>
        <p className="text-muted-foreground text-sm text-pretty">
          This interview is being recorded, and leaving the window or exiting fullscreen is logged.{" "}
          <strong className="text-foreground">One more violation will end this interview.</strong>
        </p>
        {violationCount > 0 && (
          <p className="text-muted-foreground text-xs">
            Violation {violationCount} of 2
          </p>
        )}
        <Button onClick={onResume} className="w-full">
          Return to Interview
        </Button>
      </div>
    </div>
  );
}

export { IntegrityWarningModal };
