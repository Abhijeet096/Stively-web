import { LayoutDashboard, Users, CalendarDays, ClipboardCheck, Megaphone, MessageCircle, User } from "lucide-react";

import type { NavigationConfig } from "./types";

/** Real mentor tooling (Phase 10) - mentee lists, session scheduling, review, messaging, and profile management. */
export const mentorNavigation: NavigationConfig = [
  {
    items: [{ label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Mentoring",
    items: [
      { label: "My Students", href: "/mentor/students", icon: Users },
      { label: "Sessions", href: "/mentor/sessions", icon: CalendarDays },
      { label: "Reviews", href: "/mentor/reviews", icon: ClipboardCheck },
      { label: "Announcements", href: "/mentor/announcements", icon: Megaphone },
      { label: "Messages", href: "/mentor/messages", icon: MessageCircle },
    ],
  },
  {
    items: [{ label: "My Profile", href: "/mentor/profile", icon: User }],
  },
];
