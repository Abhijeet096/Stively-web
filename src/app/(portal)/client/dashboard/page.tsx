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
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { getClientWorkspaces, getClientDashboardSummary } from "@/features/client-workspace/server/queries";
import { ClientWorkspaceCard } from "@/features/client-workspace/components/client/client-workspace-card";
import { formatPrice } from "@/lib/utils";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { QuickActionCard } from "@/components/dashboard-shell/widgets/quick-action-card";
import { EmptyState } from "@/components/sections/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import Link from "next/link";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export const metadata: Metadata = { title: "Business Dashboard" };

// Each links into the in-portal catalog (/client/offerings) pre-filtered to
// its category, instead of the public Contact form - a logged-in client
// browses real offerings in-app, then Request Proposal/Book Consultation
// (further down this page) are the only two places that ever create a Lead.
const SERVICES = [
  {
    label: "Website Development",
    description: "Marketing sites, web apps, and platforms",
    icon: Globe,
    category: "WEBSITE_DEVELOPMENT",
  },
  {
    label: "AI Development",
    description: "Practical AI features and automation",
    icon: Bot,
    category: "AI_SOLUTIONS",
  },
  {
    label: "Custom Software",
    description: "Software built around how you work",
    icon: Code2,
    category: "SOFTWARE_DEVELOPMENT",
  },
  {
    label: "Mobile Apps",
    description: "Cross-platform iOS and Android apps",
    icon: Smartphone,
    category: "MOBILE_DEVELOPMENT",
  },
  {
    label: "Digital Marketing",
    description: "Growth support alongside your build",
    icon: Megaphone,
    category: "DIGITAL_MARKETING",
  },
] as const;

/**
 * Business/Client accounts only see business-relevant content - no
 * Training/Internship/Career items appear anywhere on this page, per the
 * brief's "Business users should only see business-related services"
 * rule. Current Projects / Invoices are real, RBAC-scoped aggregate
 * queries (client-workspace/server/queries.ts) - every number here is a
 * direct DB read, never fabricated.
 */
export default async function ClientDashboardPage() {
  const user = await requireRole("CLIENT");
  const firstName = user.name?.split(" ")[0];
  const offerings = await getOfferingsForAudience("BUSINESS");
  const { requests } = await getMyRequests(user.id, "BUSINESS", {});

  const viewer = await resolveClientWorkspaceViewer(user.id);
  const workspaces = await getClientWorkspaces(viewer);
  const { upcomingPayments, latestUpdate } = await getClientDashboardSummary(viewer);

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
                <Link href="/client/offerings">See full details</Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ category, ...service }) => (
              <QuickActionCard key={service.label} {...service} href={`/client/offerings?category=${category}`} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="Explore offerings"
            description="Software, AI, marketing, and more - picked for businesses."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/offerings">Browse all</Link>
              </Button>
            }
          />
          <OfferingGrid offerings={offerings} hrefBase="/client/offerings" />
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
            emptyStateHref="/client/offerings"
            emptyStateLabel="Browse offerings"
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="Get started" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              label="Request Proposal"
              description="Browse offerings and get a scoped estimate"
              icon={FileText}
              href="/client/offerings"
            />
            <QuickActionCard
              label="Book Consultation"
              description="Talk through your project with our team"
              icon={CalendarClock}
              href="/client/consultation"
            />
          </div>
        </section>

        {latestUpdate && (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Latest update" />
            <Card>
              <CardContent className="flex flex-col gap-1.5 py-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-medium">{latestUpdate.salesProject.clientName}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(latestUpdate.createdAt)}</span>
                </div>
                {latestUpdate.completedItems.length > 0 && (
                  <ul className="text-muted-foreground list-inside list-disc text-sm">
                    {latestUpdate.completedItems.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/client/projects/${latestUpdate.salesProject.salesLeadId}`}
                  className="text-primary text-sm hover:underline"
                >
                  View full project
                </Link>
              </CardContent>
            </Card>
          </section>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Current projects"
              action={
                workspaces.length > 0 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/client/projects">View all</Link>
                  </Button>
                ) : undefined
              }
            />
            {workspaces.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No active projects"
                description="Once a project kicks off, you'll be able to track its progress here."
                actionLabel="Request Proposal"
                actionHref="/client/offerings"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {workspaces.slice(0, 3).map((lead) => (
                  <ClientWorkspaceCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Payments due"
              action={
                upcomingPayments.length > 0 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/client/invoices">View all</Link>
                  </Button>
                ) : undefined
              }
            />
            {upcomingPayments.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No payments due"
                description="Invoices for your projects will appear here once billing begins."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingPayments.slice(0, 3).map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground text-sm font-medium">
                          {payment.label ?? "Project payment"} · {payment.salesProject.clientName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {payment.dueDate ? `Due ${formatDate(payment.dueDate)}` : "No due date set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-medium">{formatPrice(payment.amount)}</span>
                        <Badge variant={payment.status === "DUE" ? "warning" : "outline"}>
                          {payment.status === "DUE" ? "Due" : "Pending"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
