import { Clock, Mail, Phone, MessageSquare } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { LINK_STATUS_LABEL, LINK_STATUS_VARIANT } from "../../lib/labels";
import {
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_VARIANT,
  RECOMMENDATION_LABEL,
  RECOMMENDATION_VARIANT,
} from "@/features/interviews/lib/report-labels";
import type { CandidateReport as CandidateReportData } from "../../server/queries";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground w-36 shrink-0 text-xs">{label}</span>
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="text-foreground w-10 shrink-0 text-right text-xs font-medium tabular-nums">
        {Math.round(value)}
      </span>
    </div>
  );
}

function CandidateReport({ candidate }: { candidate: CandidateReportData }) {
  const link = candidate.links[0];
  const interview = link?.interview;
  const score = interview?.score;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            {interview && (
              <Badge variant={INTERVIEW_STATUS_VARIANT[interview.status]}>
                {INTERVIEW_STATUS_LABEL[interview.status]}
              </Badge>
            )}
            {score && (
              <Badge variant={RECOMMENDATION_VARIANT[score.recommendation]}>
                {RECOMMENDATION_LABEL[score.recommendation]}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {candidate.job.title} - {candidate.job.department}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden="true" />
              {candidate.email}
            </span>
            {candidate.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden="true" />
                {candidate.phone}
              </span>
            )}
          </div>
        </div>
        {link && <Badge variant={LINK_STATUS_VARIANT[link.status]}>{LINK_STATUS_LABEL[link.status]}</Badge>}
      </div>

      {!interview && (
        <Card>
          <CardContent>
            <EmptyState
              icon={MessageSquare}
              title="This candidate hasn't started their interview yet"
              description="Once they start, their transcript and evaluation will appear here."
            />
          </CardContent>
        </Card>
      )}

      {interview && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {interview.responses.length === 0 && (
                  <p className="text-muted-foreground text-sm">No questions asked yet.</p>
                )}
                {interview.responses.map((r) => (
                  <div key={r.id} className="border-border flex flex-col gap-2 border-b pb-5 last:border-b-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{r.category.replace(/_/g, " ")}</Badge>
                      {r.responseTimeMs != null && (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                          <Clock className="size-3" aria-hidden="true" />
                          {Math.round(r.responseTimeMs / 1000)}s response time
                        </span>
                      )}
                    </div>
                    <p className="text-foreground text-sm font-medium">{r.question}</p>
                    <p className="text-muted-foreground text-sm">{r.answer ?? "(no answer recorded)"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {score && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-foreground flex flex-col gap-2 text-sm">
                      {score.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-success">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-foreground flex flex-col gap-2 text-sm">
                      {score.weaknesses.map((w, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive">-</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggested training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-foreground flex flex-col gap-2 text-sm">
                      {score.suggestedTraining.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">-</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-foreground">{interview.startedAt ? formatDateTime(interview.startedAt) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-foreground">
                    {interview.completedAt ? formatDateTime(interview.completedAt) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground">{formatDuration(interview.durationSeconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions asked</span>
                  <span className="text-foreground">{interview.responses.length}</span>
                </div>
              </CardContent>
            </Card>

            {score ? (
              <Card>
                <CardHeader>
                  <CardTitle>Scores</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Overall</span>
                    <span className="text-foreground font-display text-2xl font-semibold tabular-nums">
                      {Math.round(score.overall)}/100
                    </span>
                  </div>
                  <ScoreBar label="Communication" value={score.communication} />
                  <ScoreBar label="Confidence" value={score.confidence} />
                  <ScoreBar label="Professionalism" value={score.professionalism} />
                  {score.salesSkills != null && <ScoreBar label="Sales skills" value={score.salesSkills} />}
                  <ScoreBar label="Problem solving" value={score.problemSolving} />
                  <ScoreBar label="Leadership potential" value={score.leadershipPotential} />
                  <ScoreBar label="Learning ability" value={score.learningAbility} />
                </CardContent>
              </Card>
            ) : (
              interview.status === "COMPLETED" && (
                <Card>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Evaluation is still processing. Refresh in a moment.
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { CandidateReport };
