"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TeamMember } from "@prisma/client";
import {
  Phone,
  Mail,
  MessageCircle,
  Globe,
  MapPin,
  Star,
  Sparkles,
  ShieldCheck,
  Search as SearchIcon,
  Gauge,
  FileText,
  Ban,
  RotateCcw,
  Share2,
  ArrowRightLeft,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/sections/empty-state";
import { BUSINESS_STATUS_LABEL, BUSINESS_STATUS_VARIANT, BUSINESS_DATA_SOURCE_LABEL, WEBSITE_ANALYSIS_STATUS_LABEL, opportunityScoreTier } from "../../lib/labels";
import { analyzeBusinessWebsite, dismissBusiness, reactivateBusiness } from "../../actions/business-actions";
import { generateAIReport } from "../../actions/ai-report-actions";
import { promoteToSalesLead } from "../../actions/promote-actions";
import type { BusinessDetail as BusinessDetailData } from "../../server/queries";

const UNASSIGNED = "unassigned";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function InfoRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-3">
      <span className="text-foreground text-lg font-semibold tabular-nums">{value ?? "—"}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function BusinessDetail({ business, teamMembers }: { business: BusinessDetailData; teamMembers: TeamMember[] }) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isDismissing, setIsDismissing] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [promoteOpen, setPromoteOpen] = React.useState(false);
  const [assigneeId, setAssigneeId] = React.useState(UNASSIGNED);

  const latestAnalysis = business.websiteAnalyses[0];
  const latestReport = business.aiReports[0];
  const tier = latestReport ? opportunityScoreTier(latestReport.opportunityScore) : null;

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(undefined);
    const result = await analyzeBusinessWebsite(business.id);
    setIsAnalyzing(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleGenerateReport() {
    setIsGenerating(true);
    setError(undefined);
    const result = await generateAIReport(business.id);
    setIsGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDismissToggle() {
    setIsDismissing(true);
    const result = business.status === "DISMISSED" ? await reactivateBusiness(business.id) : await dismissBusiness(business.id);
    setIsDismissing(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handlePromote() {
    setIsPromoting(true);
    setError(undefined);
    const result = await promoteToSalesLead(business.id, assigneeId === UNASSIGNED ? undefined : assigneeId);
    setIsPromoting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setPromoteOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{business.businessName}</h1>
            <Badge variant={BUSINESS_STATUS_VARIANT[business.status]}>{BUSINESS_STATUS_LABEL[business.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {BUSINESS_DATA_SOURCE_LABEL[business.dataSource]}
            {business.promotedSalesLead && (
              <>
                {" · "}
                <Link href={`/admin/sales-crm/leads/${business.promotedSalesLead.id}`} className="text-primary hover:underline">
                  View promoted Sales Lead
                </Link>
                {" · "}
                {business.promotedSalesLead.assignedTo ? `Assigned to ${business.promotedSalesLead.assignedTo.name}` : "Unassigned"}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {!business.promotedSalesLead && business.status !== "DISMISSED" && (
            <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!business.phone}
                  title={!business.phone ? "Add a phone number to this business before promoting" : undefined}
                >
                  <ArrowRightLeft className="size-4" aria-hidden="true" />
                  Promote to Sales Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Promote to Sales Lead</DialogTitle>
                  <DialogDescription>
                    Creates a real Sales Lead from this business. Optionally assign it to a salesperson right away - they get notified immediately.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="promote-assignee">Assign to</Label>
                    <Select value={assigneeId} onValueChange={setAssigneeId}>
                      <SelectTrigger id="promote-assignee">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Leave unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button onClick={handlePromote} loading={isPromoting}>
                      Promote
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" loading={isDismissing} onClick={handleDismissToggle}>
            {business.status === "DISMISSED" ? (
              <>
                <RotateCcw className="size-4" aria-hidden="true" />
                Reactivate
              </>
            ) : (
              <>
                <Ban className="size-4" aria-hidden="true" />
                Dismiss
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Business details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:grid-cols-2">
              <InfoRow icon={Phone}>{business.phone}</InfoRow>
              <InfoRow icon={MessageCircle}>{business.whatsapp}</InfoRow>
              <InfoRow icon={Mail}>{business.email}</InfoRow>
              <InfoRow icon={Globe}>
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {business.website}
                  </a>
                )}
              </InfoRow>
              <InfoRow icon={MapPin}>{[business.address, business.city, business.state, business.country].filter(Boolean).join(", ")}</InfoRow>
              {business.googleRating != null && (
                <InfoRow icon={Star}>
                  {business.googleRating}/5 ({business.googleReviewCount ?? 0} reviews)
                </InfoRow>
              )}
              {business.industry && <InfoRow icon={FileText}>{business.industry}</InfoRow>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Website analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!business.website ? (
                <EmptyState icon={Globe} title="No website on file" description="This business has no website to analyze." />
              ) : !latestAnalysis ? (
                <EmptyState icon={Gauge} title="Not analyzed yet" description="Run the analyzer to score security, SEO, performance, and content." />
              ) : latestAnalysis.status !== "COMPLETE" ? (
                <p className="text-muted-foreground text-sm">
                  {WEBSITE_ANALYSIS_STATUS_LABEL[latestAnalysis.status]}
                  {latestAnalysis.errorMessage && `: ${latestAnalysis.errorMessage}`}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <ScorePill label="Overall" value={latestAnalysis.overallScore} />
                    <ScorePill label="Security" value={latestAnalysis.securityScore} />
                    <ScorePill label="SEO" value={latestAnalysis.seoScore} />
                    <ScorePill label="Performance" value={latestAnalysis.performanceScore} />
                    <ScorePill label="Content" value={latestAnalysis.contentScore} />
                  </div>
                  <p className="text-muted-foreground text-xs">Analyzed {formatDateTime(latestAnalysis.completedAt ?? latestAnalysis.startedAt)}</p>
                </>
              )}
              {business.website && (
                <Button size="sm" variant="outline" loading={isAnalyzing} onClick={handleAnalyze} className="self-start">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {latestAnalysis ? "Re-analyze website" : "Run analysis"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Lead Report</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!latestReport ? (
                <EmptyState icon={Sparkles} title="No report yet" description="Generate an AI report to get a summary, opportunity score, and recommendations." />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    {tier && (
                      <Badge variant={tier.variant} className="text-sm">
                        {latestReport.opportunityScore}/100 · {tier.label} opportunity
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">Generated {formatDateTime(latestReport.createdAt)}</span>
                  </div>
                  <p className="text-foreground text-sm">{latestReport.summary}</p>

                  {Array.isArray(latestReport.recommendations) && latestReport.recommendations.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-foreground text-sm font-medium">Recommendations</p>
                      <ul className="flex flex-col gap-2">
                        {(latestReport.recommendations as { title: string; description: string; priority: string; category: string }[]).map((rec, i) => (
                          <li key={i} className="border-border rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground text-sm font-medium">{rec.title}</span>
                              <Badge variant={rec.priority === "HIGH" ? "destructive" : rec.priority === "MEDIUM" ? "warning" : "secondary"}>{rec.priority}</Badge>
                            </div>
                            <p className="text-muted-foreground mt-1 text-sm">{rec.description}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestReport.suggestedOutreachMessage && (
                    <div className="border-border bg-muted/30 rounded-lg border p-3">
                      <p className="text-foreground mb-1 text-sm font-medium">Suggested outreach message</p>
                      <p className="text-muted-foreground text-sm">{latestReport.suggestedOutreachMessage}</p>
                    </div>
                  )}
                </>
              )}
              <Button size="sm" loading={isGenerating} onClick={handleGenerateReport} className="self-start">
                <Sparkles className="size-4" aria-hidden="true" />
                {latestReport ? "Regenerate report" : "Generate AI report"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Social presence</CardTitle>
            </CardHeader>
            <CardContent>
              {business.socialProfiles.length === 0 ? (
                <EmptyState icon={SearchIcon} title="None detected" description="Detected automatically when this business's website is analyzed." />
              ) : (
                <ul className="flex flex-col gap-2">
                  {business.socialProfiles.map((profile) => (
                    <li key={profile.id}>
                      <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
                        <Share2 className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {profile.platform.charAt(0) + profile.platform.slice(1).toLowerCase()}: {profile.url}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {business.activities.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {business.activities.slice(0, 15).map((activity) => (
                    <li key={activity.id} className="flex flex-col gap-0.5">
                      <span className="text-foreground text-sm">{activity.description ?? activity.type.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(activity.createdAt)}
                        {activity.performedBy && ` · ${activity.performedBy.name}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { BusinessDetail };
