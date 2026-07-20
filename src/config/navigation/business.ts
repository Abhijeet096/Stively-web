import { LayoutDashboard, LayoutGrid, Briefcase, FileText, CalendarClock, FolderKanban, ClipboardList, CreditCard, Receipt } from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * The Business/Client nav. "Request Proposal" and "Book Consultation" both
 * point at the existing public lead-capture form (`/contact?type=business`,
 * see src/components/forms/contact-form.tsx) rather than a second,
 * duplicate intake form living inside the dashboard - one lead pipeline,
 * not two. Current Projects / Invoices are real portal routes with empty
 * states today (Payments/Project Management aren't built yet - see
 * src/config/navigation/README.md's future-extension notes).
 */
export const businessNavigation: NavigationConfig = [
  {
    items: [{ label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Work with us",
    items: [
      { label: "Offerings", href: "/offerings", icon: LayoutGrid, external: true },
      { label: "Our Services", href: "/services", icon: Briefcase, external: true },
      { label: "Request Proposal", href: "/contact?type=business", icon: FileText, external: true },
      {
        label: "Book Consultation",
        href: "/contact?type=business",
        icon: CalendarClock,
        external: true,
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "My Service Requests", href: "/client/requests", icon: ClipboardList },
      { label: "My Orders", href: "/client/orders", icon: CreditCard },
      { label: "Current Projects", href: "/client/projects", icon: FolderKanban },
      { label: "Invoices", href: "/client/invoices", icon: Receipt },
    ],
  },
];
