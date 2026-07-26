/**
 * Plain TypeScript, zero AI, zero invented numbers - every value here comes
 * either from salesperson-entered assumptions or simple arithmetic on a
 * salesperson-entered package price. See ProposalVersion.content's schema
 * comment: roiEstimate is nullable and simply omitted from a proposal when
 * the salesperson hasn't entered real assumptions, exactly matching the
 * brief's explicit "do not invent revenue numbers."
 */

export interface RoiAssumptions {
  currentMonthlyLeads: number;
  /** e.g. 50 means "50% more leads expected". */
  estimatedUpliftPercent: number;
  /** Paise - optional, only used to project a revenue figure if given. */
  averageDealValue?: number | null;
  notes?: string | null;
}

export interface RoiEstimate {
  currentMonthlyLeads: number;
  expectedMonthlyLeads: number;
  upliftPercent: number;
  estimatedAdditionalLeadsPerMonth: number;
  /** Paise - null unless averageDealValue was provided. */
  estimatedAdditionalMonthlyRevenue: number | null;
  notes: string | null;
}

/** Returns null (section omitted entirely) unless both required assumptions are real, positive numbers. */
export function computeRoiEstimate(input: Partial<RoiAssumptions> | null | undefined): RoiEstimate | null {
  if (!input) return null;
  const { currentMonthlyLeads, estimatedUpliftPercent, averageDealValue, notes } = input;
  if (currentMonthlyLeads == null || estimatedUpliftPercent == null) return null;
  if (currentMonthlyLeads <= 0 || estimatedUpliftPercent <= 0) return null;

  const expectedMonthlyLeads = Math.round(currentMonthlyLeads * (1 + estimatedUpliftPercent / 100));
  const estimatedAdditionalLeadsPerMonth = expectedMonthlyLeads - currentMonthlyLeads;
  const estimatedAdditionalMonthlyRevenue =
    averageDealValue != null && averageDealValue > 0 ? Math.round(estimatedAdditionalLeadsPerMonth * averageDealValue) : null;

  return {
    currentMonthlyLeads,
    expectedMonthlyLeads,
    upliftPercent: estimatedUpliftPercent,
    estimatedAdditionalLeadsPerMonth,
    estimatedAdditionalMonthlyRevenue,
    notes: notes?.trim() || null,
  };
}

export interface PaymentMilestone {
  label: string;
  percent: number;
  /** Paise - always Math.round(percent/100 * totalAmount), never AI-produced. */
  amount: number;
}

/** A common, editable default split - the salesperson can change labels/percents; amounts are always recomputed from the real package price. */
export const DEFAULT_PAYMENT_MILESTONE_SPLIT: { label: string; percent: number }[] = [
  { label: "Advance", percent: 40 },
  { label: "On development completion", percent: 30 },
  { label: "On delivery", percent: 30 },
];

export function computePaymentSchedule(totalAmount: number, milestones: { label: string; percent: number }[]): PaymentMilestone[] {
  return milestones.map((m) => ({ label: m.label, percent: m.percent, amount: Math.round((m.percent / 100) * totalAmount) }));
}
