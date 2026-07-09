import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes intelligently, resolving conflicts (e.g. "p-2 p-4" -> "p-4").
 * Used by every shadcn/ui component and any component that accepts a `className` override.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Program.price (stored in paise, the smallest INR unit - see
 * prisma/schema.prisma) into a display string like "₹4,999". Centralized
 * here rather than reimplemented per component, since price displays on
 * Home, Training, Pricing, and Program Detail all need the same formatting.
 */
export function formatPrice(amountInPaise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100);
}
