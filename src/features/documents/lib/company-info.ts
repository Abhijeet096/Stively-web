/**
 * Payment/signature details that go on every generated financial document.
 * PLACEHOLDER VALUES - confirmed explicitly by the founder that the example
 * PDF's bank details are not the real production values. Swap these for the
 * real account/UPI details before any invoice generated from this engine
 * goes to a real client - see ROADMAP.md P1 (Invoice + Receipt generation).
 */
export const COMPANY_PAYMENT_INFO = {
  bankName: "TODO - real bank name",
  accountName: "TODO - real account holder name",
  accountNumber: "TODO - real account number",
  upiId: "TODO - real UPI ID",
} as const;

export const COMPANY_SIGNATORY = {
  name: "Abhijit Karande",
  title: "Founder & CEO",
} as const;
