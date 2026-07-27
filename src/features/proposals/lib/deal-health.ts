export type DealHealthLevel = "COLD" | "AT_RISK" | "WARM" | "ON_TRACK" | "CLOSED";

export interface DealHealthSignal {
  level: DealHealthLevel;
  daysSinceLastActivity: number | null;
  /** Human-readable, grounded only in real Proposal fields - never invented. */
  reasons: string[];
  suggestFollowUp: boolean;
}

const TERMINAL_STATUSES = ["ACCEPTED", "REJECTED", "EXPIRED"];
/** Sent but never opened after this many days - hardcoded for V1, not admin-configurable (would over-build for current deal volume; revisit if usage grows, same as LeadScoringConfig's own history). */
const COLD_DAYS_NO_VIEW = 5;
/** Opened but no reply after this many days. */
const AT_RISK_DAYS_NO_REPLY = 4;

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

/**
 * Pure, zero-I/O - no `server-only`, same convention as ./readiness.ts.
 * Every signal already exists on Proposal (status, sentAt, viewCount,
 * lastViewedAt) - no new schema needed, no AI involved in the health level
 * itself (only the optional follow-up message copy is AI-drafted, see
 * server/deal-health-engine.ts).
 */
export function computeDealHealth(proposal: {
  status: string;
  sentAt: Date | null;
  viewCount: number;
  lastViewedAt: Date | null;
}): DealHealthSignal {
  if (TERMINAL_STATUSES.includes(proposal.status)) {
    return { level: "CLOSED", daysSinceLastActivity: null, reasons: [], suggestFollowUp: false };
  }

  if (!proposal.sentAt) {
    return { level: "ON_TRACK", daysSinceLastActivity: null, reasons: ["Not sent yet"], suggestFollowUp: false };
  }

  const daysSinceSent = daysSince(proposal.sentAt)!;

  if (proposal.viewCount === 0) {
    if (daysSinceSent >= COLD_DAYS_NO_VIEW) {
      return {
        level: "COLD",
        daysSinceLastActivity: daysSinceSent,
        reasons: [`Sent ${daysSinceSent} days ago, not opened yet`],
        suggestFollowUp: true,
      };
    }
    return { level: "ON_TRACK", daysSinceLastActivity: daysSinceSent, reasons: [`Sent ${daysSinceSent} day${daysSinceSent === 1 ? "" : "s"} ago`], suggestFollowUp: false };
  }

  const daysSinceView = daysSince(proposal.lastViewedAt);
  if (daysSinceView != null && daysSinceView >= AT_RISK_DAYS_NO_REPLY) {
    return {
      level: "AT_RISK",
      daysSinceLastActivity: daysSinceView,
      reasons: [`Viewed ${proposal.viewCount} time${proposal.viewCount === 1 ? "" : "s"}, no reply in ${daysSinceView} day${daysSinceView === 1 ? "" : "s"}`],
      suggestFollowUp: true,
    };
  }

  return {
    level: "WARM",
    daysSinceLastActivity: daysSinceView,
    reasons: [`Viewed ${proposal.viewCount} time${proposal.viewCount === 1 ? "" : "s"}`],
    suggestFollowUp: false,
  };
}
