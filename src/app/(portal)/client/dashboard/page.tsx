import type { Metadata } from "next";
import {
  Globe,
  Bot,
  Code2,
  Smartphone,
  Megaphone,
  FileText,
  CalendarClock,
  FolderKanban,
  Receipt,
} from "lucide-react";

import { requireRole } from "@/lib/session";
import { getOfferingsForAudience } from "@/features/offerings/server/queries";
import { OfferingGrid } from "@/features/offerings/components/offering-grid";
import { getMyRequests } from "@/features/offering-requests/server/queries";
import { RequestList } from "@/features/offering-requests/components/request-list";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { QuickActionCard } from "@/components/dashboard-shell/widgets/quick-action-card";
import { EmptyState } from "@/components/sections/empty-state";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import Link from "next/link";

export const metadata: Metadata = { title: "Business Dashboard" };

// All five link into the existing lead-capture flow (/contact?type=business
// - see src/components/forms/contact-form.tsx) rather than five separate,
// duplicate intake forms. One pipeline, one Lead table, per
// src/lib/validations/lead.ts's existing design.
const SERVICES = [
  {
    label: "Website Development",
    description: "Marketing sites, web apps, and platforms",
    icon: Globe,
  },
  {
    label: "AI Development",
    description: "Practical AI features and automation",
    icon: Bot,
  },
  {
    label: "Custom Software",
    description: "Software built around how you work",
    icon: Code2,
  },
  {
    label: "Mobile Apps",
    description: "Cross-platform iOS and Android apps",
    icon: Smartphone,
  },
  {
    label: "Digital Marketing",
    description: "Growth support alongside your build",
    icon: Megaphone,
  },
] as const;

/**
 * Business/Client accounts only see business-relevant content - no
 * Training/Internship/Career items appear anywhere on this page, per the
 * brief's "Business users should only see business-related services"
 * rule. Current Projects / Invoices are real routes with honest empty
 * states (Project Management and Payments aren't built yet - see the
 * brief's future-preparation scope).
 */
export default async function ClientDashboardPage() {
  const user = await requireRole("CLIENT");
  const firstName = user.name?.split(" ")[0];
  const offerings = await getOfferingsForAudience("BUSINESS");
  const { requests } = await getMyRequests(user.id, "BUSINESS", {});

  return (
    <>
      <SetPageTitle title="Business Dashboard" />
      <Container className="flex flex-col gap-10 py-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}
          </h2>
          <p className="text-muted-foreground text-sm">
            Everything you need to start or manage a project with Stively.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Our services"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/services">See full details</Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <QuickActionCard key={service.label} {...service} href="/contact?type=business" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Explore offerings"
            description="Software, AI, marketing, and more - picked for businesses."
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
            title="My service requests"
            description="Proposal requests you've started or submitted."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/requests">View all</Link>
              </Button>
            }
          />
          <RequestList
            requests={requests.slice(0, 3)}
            hrefFor={(r) => (r.status === "DRAFT" ? `/request-proposal/${r.offering.slug}` : `/client/requests/${r.id}`)}
            emptyStateHref="/offerings"
            emptyStateLabel="Browse offerings"
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Get started" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              label="Request Proposal"
              description="Tell us about your project and get a scoped estimate"
              icon={FileText}
              href="/contact?type=business"
            />
            <QuickActionCard
              label="Book Consultation"
              description="Talk through your project with our team"
              icon={CalendarClock}
              href="/contact?type=business"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-4">
            <SectionHeader title="Current projects" />
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="Once a project kicks off, you'll be able to track its progress here."
              actionLabel="Request Proposal"
              actionHref="/contact?type=business"
            />
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Invoices" />
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Invoices for your projects will appear here once billing begins."
            />
          </section>
        </div>
      </Container>
    </>
  );
}
