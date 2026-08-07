import { LayoutDashboard, LayoutGrid, CalendarClock, FolderKanban, ClipboardList, CreditCard, Receipt } from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * The Business/Client nav. Every "Work with us" item is a real in-portal
 * route (src/app/(portal)/client/offerings, .../consultation) - a logged-in
 * client never gets bounced out to the public marketing site just for
 * browsing offerings or reaching sales. "Book Consultation" is the only
 * item that creates a new Lead (via bookConsultation, reusing the same
 * pipeline the public Contact form writes to - one Lead table, not two);
 * "Offerings" browses the in-app catalog and hands off to the real
 * per-offering wizard (/request-proposal/[slug]) once the client picks one -
 * previously listed three times ("Offerings"/"Our Services"/"Request
 * Proposal", all pointing at this identical href) until a pre-launch audit
 * caught it; collapsed to one entry rather than building two more distinct
 * pages just to justify the extra labels.
 */
export const businessNavigation: NavigationConfig = [
  {
    items: [{ label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Work with us",
    items: [
      { label: "Offerings", href: "/client/offerings", icon: LayoutGrid },
      { label: "Book Consultation", href: "/client/consultation", icon: CalendarClock },
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
