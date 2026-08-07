/**
 * Payment/signature details that go on every generated financial document.
 * Real values, confirmed by the founder 2026-08-08. `accountName` uses the
 * signatory's name below since a separate account-holder name wasn't given
 * explicitly - worth a quick confirmation that it matches the bank record
 * exactly (Indian bank transfers key off account number + IFSC, not name,
 * so this being slightly off wouldn't block a payment, but it's shown on
 * the document itself). `upiId` is genuinely optional - the invoice
 * template only renders that line when it's set, rather than ever printing
 * a placeholder value on a real financial document.
 */
export const COMPANY_PAYMENT_INFO = {
  bankName: "State Bank of India",
  accountName: "Abhijit Karande",
  accountNumber: "44148993297",
  ifsc: "SBIN0009992",
  upiId: undefined as string | undefined,
} as const;

export const COMPANY_SIGNATORY = {
  name: "Abhijit Karande",
  title: "Founder & CEO",
} as const;
