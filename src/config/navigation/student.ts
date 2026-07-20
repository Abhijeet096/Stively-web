import { LayoutDashboard, LayoutGrid, GraduationCap, Users, Briefcase, Compass, Bookmark, ClipboardList, Receipt, Newspaper, LifeBuoy } from "lucide-react";

import type { NavigationConfig } from "./types";

/**
 * "My Learning" (Phase 8) is always visible here, not conditionally shown
 * only to enrolled students - the nav config is static per role, and
 * making it dynamic would mean restructuring the DashboardShell
 * architecture for one item. /student/learning itself branches (NoAccessView
 * vs MyLearningView per getStudentAccessSummary), so a student without an
 * enrollment isn't confused by a nav item mysteriously appearing/disappearing -
 * they just see an honest "nothing to continue yet" page with next steps.
 */
export const studentNavigation: NavigationConfig = [
  {
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "My Learning", href: "/student/learning", icon: GraduationCap },
      { label: "My Mentors", href: "/student/mentors", icon: Users },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Offerings", href: "/offerings", icon: LayoutGrid, external: true },
      { label: "Training Programs", href: "/training", icon: GraduationCap, external: true },
      { label: "Internships", href: "/student/internships", icon: Briefcase },
      { label: "Career Guidance", href: "/student/career-guidance", icon: Compass },
      { label: "Saved Programs", href: "/student/saved-programs", icon: Bookmark },
      { label: "My Requests", href: "/student/requests", icon: ClipboardList },
      { label: "My Purchases", href: "/student/orders", icon: Receipt },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Blogs", href: "/student/blogs", icon: Newspaper },
      { label: "Support", href: "/student/support", icon: LifeBuoy },
    ],
  },
];
