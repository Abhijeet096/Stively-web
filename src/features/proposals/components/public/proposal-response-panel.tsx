"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, MessageSquareText, CalendarClock, Send } from "lucide-react";
import type { ProposalStatus, ProposalComment, ProposalMeetingRequest } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatPrice } from "@/lib/utils";
import type { ProposalPackageContent, ProposalCalculatorContent } from "../../lib/content-types";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_STATUS_VARIANT } from "../../lib/labels";
import {
  postProposalComment,
  acceptProposal,
  rejectProposal,
  requestProposalChanges,
  requestProposalMeeting,
} from "../../actions/client-proposal-actions";

interface ProposalResponsePanelProps {
  token: string;
  status: ProposalStatus;
  packages: ProposalPackageContent[];
  calculator: ProposalCalculatorContent | null;
  comments: ProposalComment[];
  meetingRequests: ProposalMeetingRequest[];
}

function MeetingStatusCard({ meetingRequest }: { meetingRequest: ProposalMeetingRequest }) {
  const formatDateTime = (date: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(date);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Meeting</CardTitle>
        <Badge variant={meetingRequest.status === "CONFIRMED" ? "success" : meetingRequest.status === "DECLINED" ? "destructive" : "secondary"}>
          {meetingRequest.status === "CONFIRMED" ? "Confirmed" : meetingRequest.status === "DECLINED" ? "Declined" : "Pending confirmation"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 text-sm">
        {meetingRequest.status === "CONFIRMED" && meetingRequest.confirmedAt ? (
          <>
            <p className="text-foreground font-medium">{formatDateTime(meetingRequest.confirmedAt)}</p>
            {meetingRequest.confirmedMethod && <p className="text-muted-foreground">Via {meetingRequest.confirmedMethod.replace(/_/g, " ")}</p>}
            {meetingRequest.meetingLink && (
              <a href={meetingRequest.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                Join the meeting
              </a>
            )}
          </>
        ) : meetingRequest.status === "DECLINED" ? (
          <p className="text-muted-foreground">We weren&apos;t able to make the requested time - reach out to find another slot.</p>
        ) : (
          <p className="text-muted-foreground">You requested {formatDateTime(meetingRequest.preferredAt)} - we&apos;ll confirm shortly.</p>
        )}
      </CardContent>
    </Card>
  );
}

const TERMINAL_STATUSES: ProposalStatus[] = ["ACCEPTED", "REJECTED", "EXPIRED"];

function CommentThread({ comments }: { comments: ProposalComment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <div key={comment.id} className="border-border rounded-lg border p-3">
          {comment.type === "MEETING_REQUEST" && (
            <Badge variant="secondary" className="mb-1.5">
              Meeting request
            </Badge>
          )}
          <p className="text-foreground text-sm">{comment.content}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {comment.clientName ?? "You"} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(comment.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * The proposal's client-facing decision surface - Accept/Reject/Request
 * Changes/Schedule Meeting plus a running comment thread. Every action here
 * hits a public, token-authenticated server action (client-proposal-
 * actions.ts) - no login, exactly what a proposal recipient expects.
 */
function ProposalResponsePanel({ token, status, packages, calculator, comments, meetingRequests }: ProposalResponsePanelProps) {
  const router = useRouter();
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const calculatorItems = calculator?.items ?? [];
  const hasPackages = packages.length > 0;

  const [commentText, setCommentText] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [isCommenting, setIsCommenting] = React.useState(false);

  const [selectedPackageId, setSelectedPackageId] = React.useState(packages[0]?.id ?? "");
  const [selectedCalcIds, setSelectedCalcIds] = React.useState<Set<string>>(
    new Set(calculatorItems.filter((i) => i.defaultSelected).map((i) => i.id))
  );
  const calculatorTotal = calculatorItems.filter((i) => selectedCalcIds.has(i.id)).reduce((sum, i) => sum + i.priceAmount, 0);
  function toggleCalcItem(id: string) {
    setSelectedCalcIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [acceptOpen, setAcceptOpen] = React.useState(false);

  const [rejectReason, setRejectReason] = React.useState("");
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);

  const [changesNote, setChangesNote] = React.useState("");
  const [isRequestingChanges, setIsRequestingChanges] = React.useState(false);
  const [changesOpen, setChangesOpen] = React.useState(false);

  const [meetingPreferredAt, setMeetingPreferredAt] = React.useState("");
  const [meetingNote, setMeetingNote] = React.useState("");
  const [isSchedulingMeeting, setIsSchedulingMeeting] = React.useState(false);
  const [meetingOpen, setMeetingOpen] = React.useState(false);
  const latestMeetingRequest = meetingRequests[0];

  const [error, setError] = React.useState<string | undefined>();

  async function handleComment() {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    setError(undefined);
    const result = await postProposalComment({ token, type: "COMMENT", content: commentText, clientName: clientName || undefined });
    setIsCommenting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCommentText("");
    router.refresh();
  }

  async function handleScheduleMeeting() {
    if (!meetingPreferredAt) return;
    setIsSchedulingMeeting(true);
    setError(undefined);
    const result = await requestProposalMeeting({
      token,
      preferredAt: meetingPreferredAt,
      note: meetingNote || undefined,
      clientName: clientName || undefined,
    });
    setIsSchedulingMeeting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMeetingOpen(false);
    setMeetingPreferredAt("");
    setMeetingNote("");
    router.refresh();
  }

  async function handleAccept() {
    setIsAccepting(true);
    setError(undefined);
    const result = await acceptProposal(
      hasPackages
        ? { token, selectedPackageId, note: commentText || undefined }
        : { token, selectedCalculatorItemIds: Array.from(selectedCalcIds), note: commentText || undefined }
    );
    setIsAccepting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAcceptOpen(false);
    router.refresh();
  }

  async function handleReject() {
    setIsRejecting(true);
    setError(undefined);
    const result = await rejectProposal({ token, reason: rejectReason || undefined });
    setIsRejecting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRejectOpen(false);
    router.refresh();
  }

  async function handleRequestChanges() {
    if (!changesNote.trim()) return;
    setIsRequestingChanges(true);
    setError(undefined);
    const result = await requestProposalChanges({ token, note: changesNote });
    setIsRequestingChanges(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setChangesOpen(false);
    setChangesNote("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Status</CardTitle>
          <Badge variant={PROPOSAL_STATUS_VARIANT[status]}>{PROPOSAL_STATUS_LABEL[status]}</Badge>
        </CardHeader>

        {!isTerminal && (
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" disabled={!hasPackages && calculatorItems.length === 0}>
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Accept Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept this proposal</DialogTitle>
                    <DialogDescription>
                      {hasPackages ? "Choose the package you'd like to go ahead with." : "Confirm the services you'd like to go ahead with."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    {hasPackages ? (
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="accept-package">Package</Label>
                        {/* Plain native <select>, not the Radix Select primitive - Radix's Select portals its
                            popover to document.body, as a sibling of this Dialog's own portal, and closing it
                            relies on a CSS-animation-end event to unmount; nested inside a Dialog that exit
                            animation can hang, leaving an invisible popover intercepting every click underneath
                            (including Confirm) indefinitely. A native select has no such portal/animation to race. */}
                        <select
                          id="accept-package"
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                        >
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} - {formatPrice(pkg.priceAmount)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label>Services</Label>
                        {calculatorItems.map((item) => (
                          <label key={item.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-2">
                              <input type="checkbox" checked={selectedCalcIds.has(item.id)} onChange={() => toggleCalcItem(item.id)} />
                              {item.label}
                            </span>
                            <span className="text-muted-foreground text-xs">{formatPrice(item.priceAmount)}</span>
                          </label>
                        ))}
                        <div className="border-border flex items-center justify-between border-t pt-2 text-sm font-medium">
                          <span>Total</span>
                          <span>{formatPrice(calculatorTotal)}</span>
                        </div>
                      </div>
                    )}
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleAccept}
                        loading={isAccepting}
                        disabled={hasPackages ? !selectedPackageId : selectedCalcIds.size === 0}
                      >
                        Confirm acceptance
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <MessageSquareText className="size-4" aria-hidden="true" />
                    Request Changes
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request changes</DialogTitle>
                    <DialogDescription>Let us know what you&apos;d like adjusted and we&apos;ll get back to you.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <Textarea placeholder="What would you like changed?" rows={4} value={changesNote} onChange={(e) => setChangesNote(e.target.value)} />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button onClick={handleRequestChanges} loading={isRequestingChanges} disabled={!changesNote.trim()}>
                        Send request
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule a meeting</DialogTitle>
                    <DialogDescription>Tell us a time that works for you and we&apos;ll confirm it.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="meeting-preferred-at">Preferred date &amp; time</Label>
                      <Input
                        id="meeting-preferred-at"
                        type="datetime-local"
                        value={meetingPreferredAt}
                        onChange={(e) => setMeetingPreferredAt(e.target.value)}
                      />
                    </div>
                    <Textarea placeholder="Anything you'd like to cover (optional)" rows={3} value={meetingNote} onChange={(e) => setMeetingNote(e.target.value)} />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button onClick={handleScheduleMeeting} loading={isSchedulingMeeting} disabled={!meetingPreferredAt}>
                        Send request
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="ghost">
                    <XCircle className="size-4" aria-hidden="true" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject this proposal</DialogTitle>
                    <DialogDescription>This can&apos;t be undone from this page - reach out to us if you change your mind.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <Textarea placeholder="Reason (optional)" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleReject} loading={isRejecting}>
                        Confirm rejection
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
        )}
      </Card>

      {latestMeetingRequest && <MeetingStatusCard meetingRequest={latestMeetingRequest} />}

      <Card>
        <CardHeader>
          <CardTitle>Comments &amp; questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CommentThread comments={comments} />
          <div className="flex flex-col gap-2">
            <Input placeholder="Your name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <Textarea placeholder="Ask a question or leave a comment..." rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <Button size="sm" loading={isCommenting} onClick={handleComment} disabled={!commentText.trim()} className="self-start">
              <Send className="size-4" aria-hidden="true" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ProposalResponsePanel };
