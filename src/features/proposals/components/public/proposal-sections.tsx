import { Target, CheckCircle2, TrendingUp, ShieldCheck, HelpCircle, Sparkles, ArrowRight, XCircle, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { ProposalContent } from "../../lib/content-types";
import type { SalesLead } from "@prisma/client";
import { computePaymentSchedule } from "../../server/roi-calculator";

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-primary text-xs font-semibold tracking-wide uppercase">{eyebrow}</span>
      <h2 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function priorityVariant(priority: "HIGH" | "MEDIUM" | "LOW") {
  return priority === "HIGH" ? "destructive" : priority === "MEDIUM" ? "warning" : "secondary";
}

export function ProposalCover({ lead, content, sequence, preparedOn }: { lead: SalesLead; content: ProposalContent; sequence: number; preparedOn: Date }) {
  return (
    <div className="border-border from-primary/5 flex flex-col gap-6 rounded-2xl border bg-linear-to-br to-transparent p-8 sm:p-12">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Proposal · PR-{String(sequence).padStart(6, "0")}</span>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Proposal for</p>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">{lead.businessName}</h1>
      </div>
      <p className="text-foreground text-lg text-pretty">{content.coverTagline}</p>
      <div className="text-muted-foreground flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <p className="text-xs uppercase">Prepared by</p>
          <p className="text-foreground font-medium">Stively</p>
        </div>
        <div>
          <p className="text-xs uppercase">Prepared on</p>
          <p className="text-foreground font-medium">{new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(preparedOn)}</p>
        </div>
      </div>
    </div>
  );
}

/** The proposal's opening section - a real score (from AILeadReport/BusinessWebsiteAnalysis) or, failing that, the grounded problemsFound list, never a fabricated number. See lib/business-audit.ts for the fallback chain. */
export function ProposalBusinessAudit({ content }: { content: ProposalContent }) {
  if (!content.businessAudit) return null;
  const { overallScore, biggestOpportunity, topImprovements } = content.businessAudit;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="AI business audit" title="Where you stand today" />
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className={`grid gap-6 ${overallScore != null ? "sm:grid-cols-2" : ""}`}>
            {overallScore != null && (
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-foreground text-4xl font-bold tabular-nums">{overallScore}/100</span>
                <span className="text-muted-foreground text-xs">Overall score</span>
              </div>
            )}
            {biggestOpportunity && (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Sparkles className="text-primary size-6" aria-hidden="true" />
                <span className="text-muted-foreground text-xs uppercase">Biggest opportunity</span>
                <p className="text-foreground text-sm">{biggestOpportunity}</p>
              </div>
            )}
          </div>
          {topImprovements.length > 0 && (
            <div className="border-border flex flex-col gap-2 border-t pt-4">
              <span className="text-muted-foreground text-xs font-medium uppercase">Top improvements</span>
              <ul className="flex flex-col gap-2">
                {topImprovements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="text-foreground font-medium">{item.title}</span>
                      {item.detail && <span className="text-muted-foreground"> — {item.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProposalNarrative({ content }: { content: ProposalContent }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SectionHeading eyebrow="Introduction" title="A note from our team" />
        <p className="text-foreground text-base leading-relaxed text-pretty">{content.executiveSummary}</p>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeading eyebrow="Business understanding" title="What we understand about your business" />
        <p className="text-foreground text-base leading-relaxed text-pretty">{content.businessUnderstanding}</p>
      </div>
    </div>
  );
}

export function ProposalProblems({ content }: { content: ProposalContent }) {
  if (content.problemsFound.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="What we found" title="Opportunities to improve" />
      <div className="grid gap-3 sm:grid-cols-2">
        {content.problemsFound.map((problem, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <div className="flex items-start justify-between gap-2">
                <span className="text-foreground font-medium">{problem.title}</span>
                <Badge variant={priorityVariant(problem.priority)}>{problem.priority}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">{problem.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProposalBeforeAfter({ content }: { content: ProposalContent }) {
  if (content.beforeAfterVision.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Before / after" title="What changes for you" />
      <div className="grid gap-3 sm:grid-cols-2">
        {content.beforeAfterVision.map((pair, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex flex-1 items-center gap-2">
                <XCircle className="text-destructive size-4 shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground text-sm">{pair.from}</span>
              </div>
              <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              <div className="flex flex-1 items-center gap-2">
                <CheckCircle2 className="text-success size-4 shrink-0" aria-hidden="true" />
                <span className="text-foreground text-sm font-medium">{pair.to}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProposalOpportunityScore({ content }: { content: ProposalContent }) {
  if (!content.opportunityScore) return null;
  const { score, factors } = content.opportunityScore;
  const impact = score >= 75 ? "High" : score >= 45 ? "Medium" : "Low";
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="AI opportunity analysis" title="Where you stand today" />
      <Card>
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-foreground text-4xl font-bold tabular-nums">{score}</span>
            <span className="text-muted-foreground text-xs">Opportunity score / 100</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-foreground text-2xl font-semibold">{impact}</span>
            <span className="text-muted-foreground text-xs">Estimated impact</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Target className="text-primary size-6" aria-hidden="true" />
            <span className="text-muted-foreground text-xs">Based on {factors.length} real signals</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProposalSolution({ content }: { content: ProposalContent }) {
  if (content.proposedSolution.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Proposed solution" title="What we'll build for you" />
      <div className="grid gap-4 sm:grid-cols-2">
        {content.proposedSolution.map((item, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="text-success size-4 shrink-0" aria-hidden="true" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-muted-foreground text-sm">{item.description}</p>
              {item.benefits.length > 0 && (
                <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
                  {item.benefits.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-1.5">
                      <span className="text-primary mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-foreground mt-1 text-sm font-medium">{item.expectedOutcome}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {content.featureBreakdown.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {content.featureBreakdown.map((f, i) => (
            <div key={i} className="border-border flex flex-col gap-0.5 rounded-lg border p-3">
              <span className="text-foreground text-sm font-medium">{f.title}</span>
              <span className="text-muted-foreground text-xs">{f.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Qualitative outcomes only - never a number or revenue figure, that's the separate human-entered ROI calculator below. */
export function ProposalEstimatedImpact({ content }: { content: ProposalContent }) {
  if (content.estimatedImpact.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Estimated business impact" title="What you can expect" />
      <div className="grid gap-3 sm:grid-cols-2">
        {content.estimatedImpact.map((item, i) => (
          <div key={i} className="border-border flex items-start gap-2.5 rounded-lg border p-3">
            <Rocket className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProposalTimeline({ content }: { content: ProposalContent }) {
  if (content.timeline.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Project roadmap" title="How we'll get there" />
      <ol className="flex flex-col gap-0">
        {content.timeline.map((stage, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="border-primary bg-background text-primary flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold">
                {i + 1}
              </span>
              {i < content.timeline.length - 1 && <span className="bg-border w-px flex-1" />}
            </div>
            <div className="flex flex-col gap-0.5 pb-6">
              <span className="text-muted-foreground text-xs font-medium uppercase">{stage.label}</span>
              <span className="text-foreground font-medium">{stage.stage}</span>
              <span className="text-muted-foreground text-sm">{stage.description}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ProposalDeliverables({ content }: { content: ProposalContent }) {
  if (content.deliverables.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Deliverables" title="What you'll receive" />
      <div className="grid gap-2 sm:grid-cols-2">
        {content.deliverables.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{d.title}</span>
              <span className="text-muted-foreground text-xs">{d.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProposalPricing({ content }: { content: ProposalContent }) {
  if (content.packages.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Pricing" title="Choose your package" />
      <div className="grid gap-4 sm:grid-cols-3">
        {content.packages.map((pkg) => {
          const schedule = content.paymentMilestones.length > 0 ? computePaymentSchedule(pkg.priceAmount, content.paymentMilestones) : [];
          return (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <p className="text-foreground text-2xl font-bold">{formatPrice(pkg.priceAmount)}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <ul className="flex flex-1 flex-col gap-1.5">
                  {pkg.whatsIncluded.map((item, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-1.5 text-sm">
                      <CheckCircle2 className="text-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                {schedule.length > 0 && (
                  <div className="border-border flex flex-col gap-1 border-t pt-3">
                    <span className="text-muted-foreground text-xs font-medium uppercase">Payment schedule</span>
                    {schedule.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {m.label} ({m.percent}%)
                        </span>
                        <span className="text-foreground font-medium">{formatPrice(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ProposalRoi({ content }: { content: ProposalContent }) {
  if (!content.roiEstimate) return null;
  const roi = content.roiEstimate;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="ROI calculator" title="What this could mean for your business" />
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-foreground text-2xl font-bold tabular-nums">{roi.currentMonthlyLeads}/mo</span>
              <span className="text-muted-foreground text-xs">Current leads</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <TrendingUp className="text-success size-6" aria-hidden="true" />
              <span className="text-muted-foreground text-xs">Estimated increase: {roi.upliftPercent}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-success text-2xl font-bold tabular-nums">{roi.expectedMonthlyLeads}/mo</span>
              <span className="text-muted-foreground text-xs">Expected leads</span>
            </div>
          </div>
          {roi.estimatedAdditionalMonthlyRevenue != null && (
            <p className="text-foreground text-center text-sm">
              That&apos;s an estimated <span className="font-semibold">{formatPrice(roi.estimatedAdditionalMonthlyRevenue)}</span> in additional monthly
              revenue.
            </p>
          )}
          {roi.notes && <p className="text-muted-foreground text-center text-xs">{roi.notes}</p>}
          <p className="text-muted-foreground text-center text-xs italic">This is an estimate based on assumptions discussed with your salesperson, not a guarantee.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProposalWhyStively({ content }: { content: ProposalContent }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="Why Stively" title="Why work with us" />
      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-foreground text-sm leading-relaxed text-pretty">{content.whyStively}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProposalFaq({ content }: { content: ProposalContent }) {
  if (content.faq.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <div className="flex flex-col gap-3">
        {content.faq.map((item, i) => (
          <div key={i} className="border-border rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <HelpCircle className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <span className="text-foreground text-sm font-medium">{item.question}</span>
                <span className="text-muted-foreground text-sm">{item.answer}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
