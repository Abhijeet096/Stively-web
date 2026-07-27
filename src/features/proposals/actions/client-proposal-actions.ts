"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/actions/leads";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import { resolveProposalToken, checkProposalRateLimit } from "../server/token-queries";
import { notifySalespersonOnProposalEvent } from "./proposal-actions";
import {
  postProposalCommentSchema,
  acceptProposalSchema,
  rejectProposalSchema,
  requestProposalChangesSchema,
  requestProposalMeetingSchema,
  askProposalQuestionSchema,
} from "../validation/proposal-schemas";
import type { ProposalContent } from "../lib/content-types";
import { answerProposalQuestion } from "../server/proposal-chat-engine";

const TERMINAL_STATUSES = ["ACCEPTED", "REJECTED", "EXPIRED"];

/**
 * Every action here is deliberately NOT behind requireRole - the client
 * viewing a proposal is never a Stively User (see Proposal.token's schema
 * comment, identical reasoning to InterviewLink/candidate-actions.ts). The
 * token itself, re-resolved fresh on every call, is the only credential.
 * Rate-limited via checkProposalRateLimit since a leaked link could
 * otherwise spam the notification/activity-writing paths below.
 */

export type PostProposalCommentResult = ActionResult;

export async function postProposalComment(input: unknown): Promise<PostProposalCommentResult> {
  const parsed = postProposalCommentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  try {
    await prisma.proposalComment.create({
      data: { proposalId: proposal.id, type: data.type, content: data.content, clientName: data.clientName },
    });

    const nextStatus = proposal.status === "SENT" || proposal.status === "VIEWED" ? "COMMENTED" : undefined;
    if (nextStatus) {
      await prisma.proposal.update({ where: { id: proposal.id }, data: { status: nextStatus } });
    }

    const activityType = data.type === "MEETING_REQUEST" ? "PROPOSAL_MEETING_REQUESTED" : "PROPOSAL_COMMENTED";
    await logSalesLeadActivity({
      salesLeadId: proposal.salesLeadId,
      type: activityType,
      description: data.content.slice(0, 200),
      performedById: null,
    });

    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: data.type === "MEETING_REQUEST" ? "PROPOSAL_MEETING_REQUESTED" : "PROPOSAL_COMMENTED",
      title: data.type === "MEETING_REQUEST" ? "Meeting requested" : "New comment on your proposal",
      body: `${proposal.salesLead.businessName}: ${data.content.slice(0, 140)}`,
    });

    revalidatePath(`/proposal/${data.token}`);
    return { success: true };
  } catch (error) {
    console.error("postProposalComment failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type AcceptProposalResult = ActionResult;

/**
 * Sets SalesLead.status = WON (guarded to never regress an already-terminal
 * pipeline stage) - the exact precondition the admin CRM's existing
 * "Convert to Project" panel already checks. Deliberately does NOT call
 * convertLeadToProject itself - that stays a deliberate, ADMIN/SUPER_ADMIN-
 * gated click (see project-actions.ts), never something a public,
 * token-authenticated action can trigger.
 */
export async function acceptProposal(input: unknown): Promise<AcceptProposalResult> {
  const parsed = acceptProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (TERMINAL_STATUSES.includes(proposal.status)) {
    return { success: false, error: "This proposal has already been responded to." };
  }
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  const currentVersion = proposal.versions[0];
  const content = currentVersion?.content as unknown as ProposalContent | undefined;

  // Never trust a client-sent price/id - always resolve against the real persisted content, same discipline as Razorpay's verifyPayment recomputing amounts server-side.
  let selectedPackageId: string | null = null;
  let selectedCalculatorItemIds: string[] = [];
  let acceptedLabel = "the proposal";

  if (data.selectedPackageId) {
    const pkg = content?.packages.find((p) => p.id === data.selectedPackageId);
    if (!pkg) return { success: false, error: "Please choose a valid package." };
    selectedPackageId = data.selectedPackageId;
    acceptedLabel = pkg.name;
  } else if (data.selectedCalculatorItemIds && data.selectedCalculatorItemIds.length > 0) {
    const items = content?.calculator?.items ?? [];
    const chosen = items.filter((i) => data.selectedCalculatorItemIds!.includes(i.id));
    if (chosen.length !== data.selectedCalculatorItemIds.length) return { success: false, error: "Please choose valid services." };
    selectedCalculatorItemIds = chosen.map((i) => i.id);
    acceptedLabel = chosen.map((i) => i.label).join(", ");
  } else {
    return { success: false, error: "Please choose a package or at least one service." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: "ACCEPTED", respondedAt: new Date(), selectedPackageId, selectedCalculatorItemIds, clientResponseNote: data.note },
      });
      const lead = await tx.salesLead.findUnique({ where: { id: proposal.salesLeadId }, select: { status: true } });
      if (lead && lead.status !== "WON" && lead.status !== "LOST") {
        await tx.salesLead.update({ where: { id: proposal.salesLeadId }, data: { status: "WON" } });
      }
    });

    await logSalesLeadActivity({
      salesLeadId: proposal.salesLeadId,
      type: "PROPOSAL_ACCEPTED",
      description: `Accepted ${acceptedLabel}`,
      performedById: null,
    });

    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: "PROPOSAL_ACCEPTED",
      title: "Proposal accepted!",
      body: `${proposal.salesLead.businessName} accepted "${proposal.title}".`,
    });

    revalidatePath(`/proposal/${data.token}`);
    revalidatePath(`/admin/sales-crm/leads/${proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("acceptProposal failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type RejectProposalResult = ActionResult;

/** Never auto-sets SalesLead.status = LOST - that stays the salesperson's deliberate call via the existing lost-reason UI, same "let a human decide the pipeline stage" precedent used everywhere else in this codebase. */
export async function rejectProposal(input: unknown): Promise<RejectProposalResult> {
  const parsed = rejectProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (TERMINAL_STATUSES.includes(proposal.status)) {
    return { success: false, error: "This proposal has already been responded to." };
  }
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  try {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "REJECTED", respondedAt: new Date(), clientResponseNote: data.reason },
    });

    await logSalesLeadActivity({
      salesLeadId: proposal.salesLeadId,
      type: "PROPOSAL_REJECTED",
      description: data.reason?.slice(0, 200),
      performedById: null,
    });

    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: "PROPOSAL_REJECTED",
      title: "Proposal rejected",
      body: `${proposal.salesLead.businessName} declined "${proposal.title}".`,
    });

    revalidatePath(`/proposal/${data.token}`);
    revalidatePath(`/admin/sales-crm/leads/${proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("rejectProposal failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type RequestProposalMeetingResult = ActionResult;

/**
 * Creates a real ProposalMeetingRequest (real preferredAt, not just a canned
 * comment) - the salesperson confirms/declines it from the workspace (see
 * proposal-actions.ts's confirmProposalMeeting/declineProposalMeeting). No
 * real Google Calendar/Meet API integration exists in this codebase - the
 * salesperson pastes a real meeting link they generated themselves on
 * confirm, same manual-scheduling precedent as Operations' Meeting model.
 */
export async function requestProposalMeeting(input: unknown): Promise<RequestProposalMeetingResult> {
  const parsed = requestProposalMeetingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const preferredAt = new Date(data.preferredAt);
  if (Number.isNaN(preferredAt.getTime())) return { success: false, error: "Please choose a valid date and time." };

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  try {
    await prisma.proposalMeetingRequest.create({
      data: { proposalId: proposal.id, preferredAt, clientNote: data.note, clientName: data.clientName },
    });

    await logSalesLeadActivity({
      salesLeadId: proposal.salesLeadId,
      type: "PROPOSAL_MEETING_REQUESTED",
      description: `Requested a meeting for ${preferredAt.toLocaleString("en-IN")}`,
      performedById: null,
    });

    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: "PROPOSAL_MEETING_REQUESTED",
      title: "Meeting requested",
      body: `${proposal.salesLead.businessName} would like to meet on ${preferredAt.toLocaleString("en-IN")}.`,
    });

    revalidatePath(`/proposal/${data.token}`);
    revalidatePath(`/admin/sales-crm/leads/${proposal.salesLeadId}/proposal`);
    revalidatePath(`/sales/leads/${proposal.salesLeadId}/proposal`);
    return { success: true };
  } catch (error) {
    console.error("requestProposalMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type RequestProposalChangesResult = ActionResult;

export async function requestProposalChanges(input: unknown): Promise<RequestProposalChangesResult> {
  const parsed = requestProposalChangesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (TERMINAL_STATUSES.includes(proposal.status)) {
    return { success: false, error: "This proposal has already been responded to." };
  }
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: "REVISION_REQUESTED", respondedAt: new Date(), clientResponseNote: data.note },
      });
      const lead = await tx.salesLead.findUnique({ where: { id: proposal.salesLeadId }, select: { status: true } });
      if (lead && lead.status !== "WON" && lead.status !== "LOST") {
        await tx.salesLead.update({ where: { id: proposal.salesLeadId }, data: { status: "NEGOTIATION" } });
      }
    });

    await logSalesLeadActivity({
      salesLeadId: proposal.salesLeadId,
      type: "PROPOSAL_REVISION_REQUESTED",
      description: data.note.slice(0, 200),
      performedById: null,
    });

    await notifySalespersonOnProposalEvent({
      salesLeadId: proposal.salesLeadId,
      proposalId: proposal.id,
      type: "PROPOSAL_REVISION_REQUESTED",
      title: "Changes requested on proposal",
      body: `${proposal.salesLead.businessName}: ${data.note.slice(0, 140)}`,
    });

    revalidatePath(`/proposal/${data.token}`);
    revalidatePath(`/admin/sales-crm/leads/${proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("requestProposalChanges failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type AskProposalQuestionResult = ActionResult & { answer?: string };

const AI_CHAT_WINDOW_MS = 60_000;
// Real client Q&A during one reading session is nowhere close to this - this
// is the first Groq call in this codebase reachable by an anonymous public
// token holder, so it gets a tighter cap than the general 10/60s limiter.
const AI_CHAT_MAX_PER_WINDOW = 5;

/** Grounds the answer only in this proposal's own already-generated content (proposal-chat-engine.ts) - never a general-purpose chatbot. Persists both question and answer as one ProposalComment row (type AI_CHAT) so the salesperson sees every exchange in the existing comments card. */
export async function askProposalQuestion(input: unknown): Promise<AskProposalQuestionResult> {
  const parsed = askProposalQuestionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const resolution = await resolveProposalToken(data.token);
  if (resolution.status === "not_found") return { success: false, error: "This proposal link is invalid." };
  if (resolution.status === "expired") return { success: false, error: "This proposal has expired." };

  const { proposal } = resolution;
  if (!(await checkProposalRateLimit(proposal.id))) {
    return { success: false, error: "Too many requests. Please wait a moment and try again." };
  }

  const recentChatCount = await prisma.proposalComment.count({
    where: { proposalId: proposal.id, type: "AI_CHAT", createdAt: { gte: new Date(Date.now() - AI_CHAT_WINDOW_MS) } },
  });
  if (recentChatCount >= AI_CHAT_MAX_PER_WINDOW) {
    return { success: false, error: "Too many questions at once. Please wait a moment and try again." };
  }

  const content = proposal.versions[0]?.content as unknown as ProposalContent | undefined;
  if (!content) return { success: false, error: "This proposal isn't ready yet." };

  try {
    const answer = await answerProposalQuestion(content, data.question);

    await prisma.proposalComment.create({
      data: { proposalId: proposal.id, type: "AI_CHAT", content: data.question, aiAnswer: answer, clientName: data.clientName },
    });

    revalidatePath(`/proposal/${data.token}`);
    return { success: true, answer };
  } catch (error) {
    console.error("askProposalQuestion failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
