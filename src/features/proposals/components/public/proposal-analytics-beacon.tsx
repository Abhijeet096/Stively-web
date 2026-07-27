"use client";

import * as React from "react";

const FLUSH_INTERVAL_MS = 15_000;
const TICK_INTERVAL_MS = 1_000;
const MAX_DELTA_MS = 30_000;
const SESSION_STORAGE_KEY = "stively_proposal_session";

/**
 * Invisible - real engagement telemetry (time-on-page, time-per-section),
 * not a fabricated "viewed" counter (Proposal.viewCount already covers
 * simple render-counting). sessionId lives in sessionStorage only
 * (tab-scoped, no cookie, no cross-visit identity - no PII beyond what's
 * already collected). Active time only counts while the tab is actually
 * visible (Page Visibility API), flushed via sendBeacon - the only reliable
 * "about to close the tab" delivery mechanism - to a real API route (see
 * app/api/proposal/[token]/analytics/route.ts), since a Server Action can't
 * be sendBeacon's target.
 */
function ProposalAnalyticsBeacon({ token }: { token: string }) {
  React.useEffect(() => {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }

    let activeMs = 0;
    const sectionMs: Record<string, number> = {};
    let lastTick = Date.now();
    const visibleSections = new Set<string>();

    function tick() {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      if (document.visibilityState !== "visible") return;
      activeMs += delta;
      for (const key of visibleSections) {
        sectionMs[key] = (sectionMs[key] ?? 0) + delta;
      }
    }

    function flush() {
      tick();
      if (activeMs <= 0) return;
      const payload = {
        sessionId,
        activeMsDelta: Math.min(Math.round(activeMs), MAX_DELTA_MS),
        sections: Object.fromEntries(Object.entries(sectionMs).map(([key, ms]) => [key, Math.min(Math.round(ms), MAX_DELTA_MS)])),
      };
      navigator.sendBeacon(`/api/proposal/${token}/analytics`, new Blob([JSON.stringify(payload)], { type: "application/json" }));
      activeMs = 0;
      for (const key of Object.keys(sectionMs)) sectionMs[key] = 0;
    }

    const tickInterval = setInterval(tick, TICK_INTERVAL_MS);
    const flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

    function handleVisibilityChange() {
      lastTick = Date.now();
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flush);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = entry.target.getAttribute("data-proposal-section");
          if (!key) continue;
          if (entry.isIntersecting) visibleSections.add(key);
          else visibleSections.delete(key);
        }
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-proposal-section]").forEach((el) => observer.observe(el));

    return () => {
      flush();
      clearInterval(tickInterval);
      clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flush);
      observer.disconnect();
    };
  }, [token]);

  return null;
}

export { ProposalAnalyticsBeacon };
