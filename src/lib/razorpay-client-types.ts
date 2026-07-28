/**
 * Shared `window.Razorpay` typing for every client-side checkout button
 * (Orders, approved custom quotes, Client Workspace project payments).
 * Declared once here and imported (not redeclared) by each - TypeScript
 * requires every `declare global` merge of the same interface to be
 * structurally identical, so duplicating this per-file breaks the moment
 * any one of them drifts (as happened here).
 */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void; on: (event: string, handler: (response: unknown) => void) => void };
  }
}
