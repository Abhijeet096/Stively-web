"use client";

import * as React from "react";

import { logIntegrityViolation, type IntegrityViolationType } from "../actions/integrity-actions";

export interface IntegrityViolationOutcome {
  violationCount: number;
  terminated: boolean;
}

interface UseIntegrityGuardOptions {
  interviewId: string;
  /** Only armed once the interview has actually started - don't fire on the landing/loading screens. */
  enabled: boolean;
  onViolation: (outcome: IntegrityViolationOutcome) => void;
}

/**
 * Detects the two integrity signals worth trusting - leaving fullscreen and
 * switching away from the tab - and reports each one to the
 * server-authoritative logIntegrityViolation. Deliberately does NOT listen
 * for `blur`: it fires for legitimate reasons (a permission dialog, an OS
 * notification) and would produce constant false positives.
 *
 * A single alt-tab typically fires both `fullscreenchange` and
 * `visibilitychange` within the same tick - the `handling` ref collapses
 * that into exactly one logIntegrityViolation call, not two.
 */
function useIntegrityGuard({ interviewId, enabled, onViolation }: UseIntegrityGuardOptions) {
  const enabledRef = React.useRef(enabled);
  const handlingRef = React.useRef(false);

  React.useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const reportViolation = React.useCallback(
    (type: IntegrityViolationType) => {
      if (!enabledRef.current || handlingRef.current) return;
      handlingRef.current = true;

      logIntegrityViolation(interviewId, type)
        .then((result) => {
          if (result.success) {
            onViolation({ violationCount: result.violationCount, terminated: result.terminated });
          }
        })
        .catch((error) => console.error("logIntegrityViolation failed:", error))
        .finally(() => {
          handlingRef.current = false;
        });
    },
    [interviewId, onViolation]
  );

  React.useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) reportViolation("FULLSCREEN_EXIT");
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") reportViolation("TAB_SWITCH");
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reportViolation]);

  const requestFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Non-fatal - the interview continues without fullscreen enforcement on browsers that reject it here.
    }
  }, []);

  return { requestFullscreen };
}

export { useIntegrityGuard };
