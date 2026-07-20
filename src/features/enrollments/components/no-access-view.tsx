import { GraduationCap, ClipboardList, Receipt, Compass, Newspaper, LifeBuoy, BookOpen } from "lucide-react";

import { EmptyState } from "@/components/sections/empty-state";
import { QuickActionCard } from "@/components/dashboard-shell/widgets/quick-action-card";

const LINKS = [
  { label: "Browse Offerings", description: "Find a program to enroll in", icon: GraduationCap, href: "/offerings" },
  { label: "My Requests", description: "Applications you've started", icon: ClipboardList, href: "/student/requests" },
  { label: "My Orders", description: "Things you've purchased", icon: Receipt, href: "/student/orders" },
  { label: "Career Guidance", description: "Talk to a career advisor", icon: Compass, href: "/student/career-guidance" },
  { label: "Blogs", description: "Articles and guides", icon: Newspaper, href: "/student/blogs" },
  { label: "Support", description: "Get help from a real person", icon: LifeBuoy, href: "/student/support" },
] as const;

/** Shown at /student/learning when getStudentAccessSummary().hasAnyAccess is false - exactly the brief's "without enrollment" list, never Assignments/Mentor/Certificates/Progress. */
function NoAccessView() {
  return (
    <div className="flex flex-col gap-8">
      <EmptyState
        icon={BookOpen}
        title="Nothing to continue yet"
        description="Once you enroll in a program, your learning space unlocks here - progress, materials, and everything else."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((link) => (
          <QuickActionCard key={link.label} {...link} />
        ))}
      </div>
    </div>
  );
}

export { NoAccessView };
