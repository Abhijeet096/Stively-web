import type { LucideIcon } from "lucide-react";
import { GraduationCap, Briefcase, Newspaper, LifeBuoy, FileText, Compass } from "lucide-react";

export interface SearchResult {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: string;
}

/**
 * Static placeholder results - there's no search index or backend yet
 * (this phase builds the UI/component architecture only, per the brief).
 * Swapping this for a real query is scoped to SearchDialog's one
 * `results` prop/state - nothing about the dialog, keyboard handling, or
 * trigger needs to change when a real search endpoint exists.
 */
export const SEARCH_RESULTS: SearchResult[] = [
  {
    label: "Training Programs",
    description: "Browse cohort-based programs",
    href: "/training",
    icon: GraduationCap,
    group: "Explore",
  },
  {
    label: "Internships",
    description: "Find an internship placement",
    href: "/student/internships",
    icon: Briefcase,
    group: "Explore",
  },
  {
    label: "Career Guidance",
    description: "Talk to a career advisor",
    href: "/student/career-guidance",
    icon: Compass,
    group: "Explore",
  },
  {
    label: "Latest Blogs",
    description: "Read recent articles",
    href: "/student/blogs",
    icon: Newspaper,
    group: "Resources",
  },
  {
    label: "Request a Proposal",
    description: "Start a project with Stively",
    href: "/contact?type=business",
    icon: FileText,
    group: "Business",
  },
  {
    label: "Support",
    description: "Get help from our team",
    href: "/student/support",
    icon: LifeBuoy,
    group: "Resources",
  },
];
