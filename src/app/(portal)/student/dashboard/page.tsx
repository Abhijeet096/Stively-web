import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Briefcase, Compass, PhoneCall, Bookmark, Newspaper, LifeBuoy } from "lucide-react";

import { requireRole } from "@/lib/session";
import { getOfferingsForAudience } from "@/features/offerings/server/queries";
import { OfferingGrid } from "@/features/offerings/components/offering-grid";
import { getMyRequests } from "@/features/offering-requests/server/queries";
import { RequestList } from "@/features/offering-requests/components/request-list";
import { getStudentAccessSummary } from "@/features/enrollments/server/access-policy";
import { ProgressCard } from "@/features/enrollments/components/progress-card";
import { EnrollmentStatusBadge } from "@/features/enrollments/components/enrollment-status-badge";
import { PrimeMembershipBanner } from "@/features/enrollments/components/prime-membership-banner";
import { prisma } from "@/lib/prisma";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { QuickActionCard } from "@/components/dashboard-shell/widgets/quick-action-card";
import { AnnouncementCard } from "@/components/dashboard-shell/widgets/announcement-card";
import { EmptyState } from "@/components/sections/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "Student Dashboard" };

const QUICK_ACTIONS = [
  {
    label: "Browse Offerings",
    description: "Training, internships, and more",
    icon: GraduationCap,
    href: "/offerings",
  },
  {
    label: "Browse Internships",
    description: "Find a placement to apply to",
    icon: Briefcase,
    href: "/student/internships",
  },
  {
    label: "Career Guidance",
    description: "Talk to a career advisor",
    icon: Compass,
    href: "/student/career-guidance",
  },
  {
    label: "Request Callback",
    description: "Have our team reach out to you",
    icon: PhoneCall,
    href: "/contact",
  },
] as const;

// Platform-level messaging, not a claim about outcomes or a testimonial -
// same "don't fabricate trust content" discipline the marketing site
// follows (see AGENTS.md), just applied here to dashboard copy instead.
const ANNOUNCEMENTS = [
  {
    title: "Welcome to your Stively dashboard",
    description: "This is where you'll track programs, internships, and updates going forward.",
    timeLabel: "Just now",
  },
] as const;

/**
 * Deliberately promotional for a student with no enrollment (see the
 * brief's explicit "without enrollment" business rule) - unchanged from
 * before Phase 8 in that case. A student WITH an active enrollment
 * (getStudentAccessSummary - src/features/enrollments/server/access-policy.ts)
 * gets one new section above Quick Actions instead: their current program
 * and real progress, nothing fabricated. "Saved Programs" and "Recent
 * Blogs" still render honest empty states, since neither backend exists yet.
 */
export default async function StudentDashboardPage() {
  const user = await requireRole("STUDENT");
  const firstName = user.name?.split(" ")[0];
  const offerings = await getOfferingsForAudience("STUDENT");
  const { requests } = await getMyRequests(user.id, "STUDENT", {});
  const accessSummary = await getStudentAccessSummary(user.id);
  const { isPrimeMember } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { isPrimeMember: true } });

  return (
    <>
      <SetPageTitle title="Student Dashboard" />
      <Container className="flex flex-col gap-10 py-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm">
            Here&apos;s where to start exploring what Stively offers students.
          </p>
        </div>

        {accessSummary.hasAnyAccess && !isPrimeMember && <PrimeMembershipBanner />}

        {accessSummary.hasAnyAccess && accessSummary.primaryEnrollment && (
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <EnrollmentStatusBadge status={accessSummary.primaryEnrollment.status} />
                <CardTitle className="font-display">{accessSummary.primaryEnrollment.offering.title}</CardTitle>
                <CardDescription>Continue where you left off.</CardDescription>
              </div>
              <Button asChild>
                <Link href="/student/learning">Continue learning</Link>
              </Button>
            </CardHeader>
            <CardContent className="border-t border-border/70 pt-4">
              <ProgressCard progressPercentage={accessSummary.primaryEnrollment.progressPercentage} />
            </CardContent>
          </Card>
        )}

        <section className="flex flex-col gap-4">
          <SectionHeader title="Quick actions" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Explore offerings"
            description="Training, internships, and more - picked for students."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/offerings">Browse all</Link>
              </Button>
            }
          />
          <OfferingGrid offerings={offerings} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="My requests"
            description="Applications you've started or submitted."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/requests">View all</Link>
              </Button>
            }
          />
          <RequestList
            requests={requests.slice(0, 3)}
            hrefFor={(r) => (r.status === "DRAFT" ? `/enroll/${r.offering.slug}` : `/student/requests/${r.id}`)}
            emptyStateHref="/offerings"
            emptyStateLabel="Browse offerings"
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Saved programs" description="Programs you bookmark will show up here." />
          <EmptyState
            icon={Bookmark}
            title="No saved programs yet"
            description="You haven't saved any training programs yet."
            actionLabel="Browse Training"
            actionHref="/training"
          />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-4">
            <SectionHeader title="Recent blogs" />
            <EmptyState
              icon={Newspaper}
              title="No blog posts yet"
              description="We'll share articles and guides here once they're published."
            />
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Announcements" />
            <div className="flex flex-col gap-3">
              {ANNOUNCEMENTS.map((announcement) => (
                <AnnouncementCard key={announcement.title} {...announcement} />
              ))}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Support" />
          <QuickActionCard
            label="Need help with something?"
            description="Reach out and a real person will get back to you."
            icon={LifeBuoy}
            href="/student/support"
            className="max-w-sm"
          />
        </section>
      </Container>
    </>
  );
}
