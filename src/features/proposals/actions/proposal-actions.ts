"use server";

import { revalidatePath } from "next/cache";
import type { Proposal, ProposalVersion, SalesLead, ProposalMeetingRequest } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import { createNotification } from "@/features/notifications/server/creation";
import {
  generateProposalSchema,
  regenerateWithCopilotSchema,
  updatePackagesAndPricingSchema,
  updateCalculatorPricingSchema,
  updateRoiAssumptionsSchema,
  sendProposalSchema,
  confirmProposalMeetingSchema,
  declineProposalMeetingSchema,
  suggestFollowUpMessageSchema,
} from "../validation/proposal-schemas";
import { getSalesLeadDiscovery, computeProposalReadiness } from "../server/discovery-queries";
import { generateProposalNarrative } from "../server/proposal-engine";
import type { ProposalGenerationContext } from "../server/proposal-prompt-service";
import { computeRoiEstimate } from "../server/roi-calculator";
import { generateProposalToken, computeProposalExpiry } from "../lib/token";
import { buildBusinessAudit } from "../lib/business-audit";
import { computeDealHealth } from "../lib/deal-health";
import { generateFollowUpMessage } from "../server/deal-health-engine";
import type { ProposalContent, ProposalOpportunityScoreContent } from "../lib/content-types";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

/** Only ADMIN/SUPER_ADMIN/SALES viewers who can already see this lead (per resolveSalesCrmViewer) may touch its proposals. Returns the lead row on success. */
async function guardLeadAccess(
  userId: string,
  role: Parameters<typeof resolveSalesCrmViewer>[1],
  salesLeadId: string
): Promise<{ ok: false; error: string } | { ok: true; lead: SalesLead }> {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) return { ok: false, error: "Lead not found." };
  return { ok: true, lead };
}

async function buildGenerationContext(salesLeadId: string, extra?: { copilotInstruction?: string; priorExecutiveSummary?: string }): Promise<
  | { ok: false; error: string }
  | { ok: true; context: ProposalGenerationContext; opportunityScore: ProposalOpportunityScoreContent | null }
> {
  const [lead, discovery, recentNotesRows] = await Promise.all([
    prisma.salesLead.findUnique({
      where: { id: salesLeadId },
      include: {
        sourceBusiness: {
          include: {
            websiteAnalyses: { orderBy: { startedAt: "desc" }, take: 1 },
            aiReports: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    getSalesLeadDiscovery(salesLeadId),
    prisma.salesLeadNote.findMany({ where: { salesLeadId }, orderBy: { createdAt: "desc" }, take: 5, select: { content: true } }),
  ]);
  if (!lead) return { ok: false, error: "Lead not found." };

  const readiness = computeProposalReadiness(discovery);
  if (!readiness.ready) {
    return { ok: false, error: `This lead isn't ready for a proposal yet - missing: ${readiness.missing.join(", ")}.` };
  }

  const offerings = await prisma.offering.findMany({
    where: { id: { in: discovery!.selectedOfferingIds } },
    select: { id: true, title: true, shortDescription: true },
  });

  const aiReport = lead.sourceBusiness?.aiReports[0] ?? null;
  const opportunityScore: ProposalOpportunityScoreContent | null = aiReport
    ? {
        score: aiReport.opportunityScore,
        factors: (aiReport.scoreFactors as unknown as { factor: string; contribution: number }[]).map((f) => ({
          factor: f.factor,
          contribution: Math.round(f.contribution * 10) / 10,
        })),
      }
    : null;

  const context: ProposalGenerationContext = {
    salesLead: lead,
    discovery: discovery!,
    recentNotes: recentNotesRows.map((n) => n.content),
    business: lead.sourceBusiness,
    websiteAnalysis: lead.sourceBusiness?.websiteAnalyses[0] ?? null,
    aiReport,
    selectedOfferings: offerings,
    copilotInstruction: extra?.copilotInstruction,
    priorExecutiveSummary: extra?.priorExecutiveSummary,
  };

  return { ok: true, context, opportunityScore };
}

export type GenerateProposalResult = ActionResult & { proposalId?: string; token?: string };

/**
 * The "Generate Proposal" button - one click, three grounded Groq calls
 * (proposal-engine.ts), assembled into version 1 of a brand-new Proposal.
 * Blocked entirely (not just UI-disabled) until computeProposalReadiness
 * says discovery is complete - a proposal must never be generated before
 * discovery, per the brief.
 */
export async function generateProposal(input: unknown): Promise<GenerateProposalResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = generateProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const guard = await guardLeadAccess(user.id, user.role, data.salesLeadId);
  if (!guard.ok) return { success: false, error: guard.error };

  try {
    const built = await buildGenerationContext(data.salesLeadId);
    if (!built.ok) return { success: false, error: built.error };
    const { context, opportunityScore } = built;

    const generated = await generateProposalNarrative(context);

    const businessAudit = buildBusinessAudit({
      aiReport: context.aiReport,
      websiteAnalysis: context.websiteAnalysis,
      problemsFound: generated.narrative.problemsFound,
    });

    const content: ProposalContent = {
      coverTagline: generated.narrative.coverTagline,
      executiveSummary: generated.narrative.executiveSummary,
      businessUnderstanding: generated.narrative.businessUnderstanding,
      problemsFound: generated.narrative.problemsFound,
      whyStively: generated.narrative.whyStively,
      faq: generated.narrative.faq,
      beforeAfterVision: generated.narrative.beforeAfter,
      proposedSolution: generated.solution.proposedSolution,
      featureBreakdown: generated.solution.featureBreakdown,
      estimatedImpact: generated.solution.expectedImpact,
      timeline: generated.delivery.timeline,
      deliverables: generated.delivery.deliverables,
      packages: [],
      paymentMilestones: [],
      calculator: null,
      roiEstimate: null,
      opportunityScore,
      businessAudit,
    };

    const actorId = await resolveActorId(user.id);

    const { proposal } = await prisma.$transaction(async (tx) => {
      const created = await tx.proposal.create({
        data: {
          salesLeadId: data.salesLeadId,
          token: generateProposalToken(),
          title: data.title ?? `Proposal for ${guard.lead.businessName}`,
          currentVersionNumber: 1,
          createdById: actorId ?? null,
        },
      });
      await tx.proposalVersion.create({
        data: {
          proposalId: created.id,
          versionNumber: 1,
          source: "AI_INITIAL",
          content: content as object,
          modelUsed: generated.modelUsed,
          createdById: actorId ?? null,
        },
      });
      return { proposal: created };
    });

    await logSalesLeadActivity({
      salesLeadId: data.salesLeadId,
      type: "PROPOSAL_GENERATED",
      description: proposal.title,
      performedById: actorId ?? null,
    });

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath(`/sales/leads/${data.salesLeadId}`);

    return { success: true, proposalId: proposal.id, token: proposal.token };
  } catch (error) {
    console.error("generateProposal failed:", error);
    return { success: false, error: "Couldn't generate the proposal right now. Please try again." };
  }
}

type ProposalWithLead = Proposal & { salesLead: SalesLead; versions: ProposalVersion[] };

async function loadProposalForEdit(
  proposalId: string,
  userId: string,
  role: Parameters<typeof resolveSalesCrmViewer>[1]
): Promise<
  | { ok: false; error: string }
  | { ok: true; proposal: ProposalWithLead; currentVersion: ProposalVersion | undefined }
> {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { salesLead: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!proposal) return { ok: false, error: "Proposal not found." };
  if (!viewer.hasFullAccess && proposal.salesLead.assignedToId !== viewer.teamMemberId) {
    return { ok: false, error: "Proposal not found." };
  }
  return { ok: true, proposal, currentVersion: proposal.versions[0] };
}

async function appendVersion(params: {
  proposal: Proposal;
  content: ProposalContent;
  source: "AI_COPILOT_UPDATE" | "MANUAL_EDIT";
  copilotInstruction?: string;
  modelUsed?: string;
  actorId?: string;
}): Promise<ProposalVersion> {
  const nextVersionNumber = params.proposal.currentVersionNumber + 1;
  const [version] = await prisma.$transaction([
    prisma.proposalVersion.create({
      data: {
        proposalId: params.proposal.id,
        versionNumber: nextVersionNumber,
        source: params.source,
        content: params.content as object,
        copilotInstruction: params.copilotInstruction,
        modelUsed: params.modelUsed,
        createdById: params.actorId ?? null,
      },
    }),
    prisma.proposal.update({ where: { id: params.proposal.id }, data: { currentVersionNumber: nextVersionNumber } }),
  ]);
  return version;
}

export type RegenerateWithCopilotResult = ActionResult;

/**
 * The AI co-pilot - salesperson types a free-text instruction ("client
 * wants a mobile app phase 2, budget 1.5L"), the 3 grounded calls re-run
 * with it as extra context, producing one new AI_COPILOT_UPDATE version.
 * Packages/paymentMilestones/roiEstimate/opportunityScore are always
 * carried over unchanged from the current version - the copilot only ever
 * touches narrative/solution/delivery, never a quoted number.
 */
export async function regenerateWithCopilot(input: unknown): Promise<RegenerateWithCopilotResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = regenerateWithCopilotSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadProposalForEdit(data.proposalId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    if (!loaded.currentVersion) return { success: false, error: "Generate the proposal content first." };
    const currentContent = loaded.currentVersion.content as unknown as ProposalContent;

    const built = await buildGenerationContext(loaded.proposal.salesLeadId, {
      copilotInstruction: data.instruction,
      priorExecutiveSummary: currentContent.executiveSummary,
    });
    if (!built.ok) return { success: false, error: built.error };

    const generated = await generateProposalNarrative(built.context);
    const actorId = await resolveActorId(user.id);

    const content: ProposalContent = {
      coverTagline: generated.narrative.coverTagline,
      executiveSummary: generated.narrative.executiveSummary,
      businessUnderstanding: generated.narrative.businessUnderstanding,
      problemsFound: generated.narrative.problemsFound,
      whyStively: generated.narrative.whyStively,
      faq: generated.narrative.faq,
      beforeAfterVision: generated.narrative.beforeAfter,
      proposedSolution: generated.solution.proposedSolution,
      featureBreakdown: generated.solution.featureBreakdown,
      estimatedImpact: generated.solution.expectedImpact,
      timeline: generated.delivery.timeline,
      deliverables: generated.delivery.deliverables,
      packages: currentContent.packages,
      paymentMilestones: currentContent.paymentMilestones,
      calculator: currentContent.calculator,
      roiEstimate: currentContent.roiEstimate,
      opportunityScore: currentContent.opportunityScore,
      businessAudit: currentContent.businessAudit,
    };

    await appendVersion({
      proposal: loaded.proposal,
      content,
      source: "AI_COPILOT_UPDATE",
      copilotInstruction: data.instruction,
      modelUsed: generated.modelUsed,
      actorId,
    });

    revalidatePath(`/admin/sales-crm/leads/${loaded.proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${loaded.proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("regenerateWithCopilot failed:", error);
    return { success: false, error: "Couldn't update the proposal right now. Please try again." };
  }
}

export type UpdatePackagesResult = ActionResult;

/** Pricing is always a salesperson-entered form, never AI-produced - see packageInputSchema/updatePackagesAndPricingSchema. Creates a MANUAL_EDIT version carrying over the AI-generated narrative/solution/delivery unchanged. */
export async function updatePackagesAndPricing(input: unknown): Promise<UpdatePackagesResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updatePackagesAndPricingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadProposalForEdit(data.proposalId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    if (!loaded.currentVersion) return { success: false, error: "Generate the proposal content first." };
    const currentContent = loaded.currentVersion.content as unknown as ProposalContent;

    const content: ProposalContent = {
      ...currentContent,
      packages: data.packages,
      paymentMilestones: data.paymentMilestones,
    };

    const actorId = await resolveActorId(user.id);
    await appendVersion({ proposal: loaded.proposal, content, source: "MANUAL_EDIT", actorId });

    revalidatePath(`/admin/sales-crm/leads/${loaded.proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${loaded.proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updatePackagesAndPricing failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type UpdateCalculatorResult = ActionResult;

/** The interactive-calculator alternative to fixed packages - same "salesperson-entered, never AI-produced" pricing discipline as updatePackagesAndPricing, kept as its own action since a proposal uses one pricing mode or the other. */
export async function updateCalculatorPricing(input: unknown): Promise<UpdateCalculatorResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateCalculatorPricingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadProposalForEdit(data.proposalId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    if (!loaded.currentVersion) return { success: false, error: "Generate the proposal content first." };
    const currentContent = loaded.currentVersion.content as unknown as ProposalContent;

    const content: ProposalContent = {
      ...currentContent,
      calculator: { items: data.items, paymentMilestones: data.paymentMilestones },
    };

    const actorId = await resolveActorId(user.id);
    await appendVersion({ proposal: loaded.proposal, content, source: "MANUAL_EDIT", actorId });

    revalidatePath(`/admin/sales-crm/leads/${loaded.proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${loaded.proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateCalculatorPricing failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type UpdateRoiResult = ActionResult;

/** ROI is computed in plain TS (roi-calculator.ts) from salesperson-entered assumptions only - omitted from content entirely if left blank, never invented. */
export async function updateRoiAssumptions(input: unknown): Promise<UpdateRoiResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = updateRoiAssumptionsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadProposalForEdit(data.proposalId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    if (!loaded.currentVersion) return { success: false, error: "Generate the proposal content first." };
    const currentContent = loaded.currentVersion.content as unknown as ProposalContent;

    const roiEstimate = computeRoiEstimate({
      currentMonthlyLeads: data.currentMonthlyLeads ?? undefined,
      estimatedUpliftPercent: data.estimatedUpliftPercent ?? undefined,
      averageDealValue: data.averageDealValue,
      notes: data.notes,
    });

    const content: ProposalContent = { ...currentContent, roiEstimate };

    const actorId = await resolveActorId(user.id);
    await appendVersion({ proposal: loaded.proposal, content, source: "MANUAL_EDIT", actorId });

    revalidatePath(`/admin/sales-crm/leads/${loaded.proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${loaded.proposal.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("updateRoiAssumptions failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

function buildProposalEmailHtml(params: { salesperson: string; ownerName: string; businessName: string; title: string; url: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi ${params.ownerName},</p>
      <p>Thank you for the opportunity to work with <strong>${params.businessName}</strong>. We've put together a proposal covering what we discussed:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${params.url}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View your proposal</a>
      </div>
      <p>You can view it, leave comments or questions, and accept or request changes directly on that page - no login needed.</p>
      <p style="margin-top:32px;">Best regards,<br/>${params.salesperson}<br/>Stively</p>
    </div>
  `;
}

export type SendProposalResult = ActionResult & { emailSent?: boolean; url?: string };

const EARLY_PIPELINE_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "MEETING_SCHEDULED"];

/** Marks the proposal SENT, sets a real expiry, emails the client via Resend (same pattern as quote-actions.ts's createAndSendQuote), and nudges an early-pipeline lead forward. */
export async function sendProposal(input: unknown): Promise<SendProposalResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = sendProposalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadProposalForEdit(data.proposalId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    if (loaded.currentVersion == null) return { success: false, error: "Generate the proposal content before sending it." };

    const actorId = await resolveActorId(user.id);
    const url = `${siteConfig.url}/proposal/${loaded.proposal.token}`;

    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({
        where: { id: loaded.proposal.id },
        data: { status: "SENT", sentAt: new Date(), expiresAt: computeProposalExpiry() },
      });
      if (EARLY_PIPELINE_STATUSES.includes(loaded.proposal.salesLead.status)) {
        await tx.salesLead.update({ where: { id: loaded.proposal.salesLeadId }, data: { status: "PROPOSAL_SENT" } });
      }
    });

    await logSalesLeadActivity({
      salesLeadId: loaded.proposal.salesLeadId,
      type: "PROPOSAL_SENT",
      description: loaded.proposal.title,
      performedById: actorId ?? null,
    });

    let emailSent = false;
    if (loaded.proposal.salesLead.email) {
      try {
        const actor = actorId ? await prisma.teamMember.findUnique({ where: { id: actorId } }) : null;
        const html = buildProposalEmailHtml({
          salesperson: actor?.name ?? "The Stively Team",
          ownerName: loaded.proposal.salesLead.ownerName,
          businessName: loaded.proposal.salesLead.businessName,
          title: loaded.proposal.title,
          url,
        });
        await resend.emails.send({
          from: EMAIL_FROM,
          to: loaded.proposal.salesLead.email,
          subject: `Your proposal from Stively - ${loaded.proposal.title}`,
          html,
        });
        emailSent = true;
      } catch (error) {
        console.error("sendProposal email failed:", error);
      }
    }

    revalidatePath(`/admin/sales-crm/leads/${loaded.proposal.salesLeadId}`);
    revalidatePath(`/sales/leads/${loaded.proposal.salesLeadId}`);
    return { success: true, emailSent, url };
  } catch (error) {
    console.error("sendProposal failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

function buildMeetingConfirmedEmailHtml(params: { businessName: string; preferredAt: Date; confirmedAt: Date; method: string; meetingLink: string | null }) {
  const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(params.confirmedAt);
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <p>Hi ${params.businessName},</p>
      <p>Your meeting request has been confirmed for <strong>${when}</strong> (${params.method.replace(/_/g, " ")}).</p>
      ${params.meetingLink ? `<div style="text-align:center;margin:32px 0;"><a href="${params.meetingLink}" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Join the meeting</a></div>` : ""}
      <p>Looking forward to speaking with you.</p>
      <p style="margin-top:32px;">Best regards,<br/>Stively</p>
    </div>
  `;
}

type MeetingRequestWithProposal = ProposalMeetingRequest & { proposal: Proposal & { salesLead: SalesLead } };

/** Shared by confirm/decline below - loads the meeting request with the same viewer-scoping as loadProposalForEdit, since a ProposalMeetingRequest is only ever touched through its parent proposal's access rules. */
async function loadMeetingRequestForEdit(
  meetingRequestId: string,
  userId: string,
  role: Parameters<typeof resolveSalesCrmViewer>[1]
): Promise<{ ok: false; error: string } | { ok: true; meetingRequest: MeetingRequestWithProposal }> {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const meetingRequest = await prisma.proposalMeetingRequest.findUnique({
    where: { id: meetingRequestId },
    include: { proposal: { include: { salesLead: true } } },
  });
  if (!meetingRequest) return { ok: false, error: "Meeting request not found." };
  if (!viewer.hasFullAccess && meetingRequest.proposal.salesLead.assignedToId !== viewer.teamMemberId) {
    return { ok: false, error: "Meeting request not found." };
  }
  return { ok: true, meetingRequest: meetingRequest as MeetingRequestWithProposal };
}

export type ConfirmProposalMeetingResult = ActionResult & { emailSent?: boolean };

/** Confirms a real time the salesperson has agreed to - meetingLink is whatever real link they generated themselves (Google Meet/Zoom/etc), never auto-created, since no Calendar API integration exists here. Emails the client a real confirmation, non-fatal if it fails. */
export async function confirmProposalMeeting(input: unknown): Promise<ConfirmProposalMeetingResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = confirmProposalMeetingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const confirmedAt = new Date(data.confirmedAt);
  if (Number.isNaN(confirmedAt.getTime())) return { success: false, error: "Please choose a valid date and time." };

  try {
    const loaded = await loadMeetingRequestForEdit(data.meetingRequestId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    const { meetingRequest } = loaded;

    const actorId = await resolveActorId(user.id);

    await prisma.proposalMeetingRequest.update({
      where: { id: meetingRequest.id },
      data: {
        status: "CONFIRMED",
        confirmedAt,
        confirmedMethod: data.confirmedMethod,
        meetingLink: data.meetingLink || null,
        confirmedById: actorId ?? null,
      },
    });

    await logSalesLeadActivity({
      salesLeadId: meetingRequest.proposal.salesLeadId,
      type: "PROPOSAL_MEETING_CONFIRMED",
      description: `Confirmed for ${confirmedAt.toLocaleString("en-IN")}`,
      performedById: actorId ?? null,
    });

    let emailSent = false;
    if (meetingRequest.proposal.salesLead.email) {
      try {
        const html = buildMeetingConfirmedEmailHtml({
          businessName: meetingRequest.proposal.salesLead.businessName,
          preferredAt: meetingRequest.preferredAt,
          confirmedAt,
          method: data.confirmedMethod,
          meetingLink: data.meetingLink || null,
        });
        await resend.emails.send({
          from: EMAIL_FROM,
          to: meetingRequest.proposal.salesLead.email,
          subject: `Your meeting with Stively is confirmed`,
          html,
        });
        emailSent = true;
      } catch (error) {
        console.error("confirmProposalMeeting email failed:", error);
      }
    }

    revalidatePath(`/admin/sales-crm/leads/${meetingRequest.proposal.salesLeadId}/proposal`);
    revalidatePath(`/sales/leads/${meetingRequest.proposal.salesLeadId}/proposal`);
    revalidatePath(`/proposal/${meetingRequest.proposal.token}`);
    return { success: true, emailSent };
  } catch (error) {
    console.error("confirmProposalMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type DeclineProposalMeetingResult = ActionResult;

export async function declineProposalMeeting(input: unknown): Promise<DeclineProposalMeetingResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = declineProposalMeetingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const loaded = await loadMeetingRequestForEdit(data.meetingRequestId, user.id, user.role);
    if (!loaded.ok) return { success: false, error: loaded.error };
    const { meetingRequest } = loaded;

    await prisma.proposalMeetingRequest.update({ where: { id: meetingRequest.id }, data: { status: "DECLINED" } });

    revalidatePath(`/admin/sales-crm/leads/${meetingRequest.proposal.salesLeadId}/proposal`);
    revalidatePath(`/sales/leads/${meetingRequest.proposal.salesLeadId}/proposal`);
    return { success: true };
  } catch (error) {
    console.error("declineProposalMeeting failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type SuggestFollowUpMessageResult = ActionResult & { message?: string };

/** Only proceeds if computeDealHealth says a follow-up is genuinely warranted - never wastes a Groq call otherwise. Returns a draft; the salesperson decides whether/how to send it, exactly like every other client-facing message in this codebase. */
export async function suggestFollowUpMessage(input: unknown): Promise<SuggestFollowUpMessageResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = suggestFollowUpMessageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const loaded = await loadProposalForEdit(parsed.data.proposalId, user.id, user.role);
  if (!loaded.ok) return { success: false, error: loaded.error };

  const health = computeDealHealth(loaded.proposal);
  if (!health.suggestFollowUp) return { success: false, error: "This proposal doesn't need a follow-up right now." };

  try {
    const message = await generateFollowUpMessage({
      businessName: loaded.proposal.salesLead.businessName,
      proposalTitle: loaded.proposal.title,
      level: health.level,
      daysSinceLastActivity: health.daysSinceLastActivity,
      viewCount: loaded.proposal.viewCount,
    });
    return { success: true, message };
  } catch (error) {
    console.error("suggestFollowUpMessage failed:", error);
    return { success: false, error: "Couldn't generate a suggestion right now. Please try again." };
  }
}

export type NotifySalespersonOnProposalEventParams = {
  salesLeadId: string;
  proposalId: string;
  type: "PROPOSAL_VIEWED" | "PROPOSAL_COMMENTED" | "PROPOSAL_MEETING_REQUESTED" | "PROPOSAL_REVISION_REQUESTED" | "PROPOSAL_ACCEPTED" | "PROPOSAL_REJECTED";
  title: string;
  body: string;
};

/** Shared by the public client-proposal-actions.ts callers - notifies the assigned salesperson (or the lead's creator, as a fallback) about client activity on a proposal. */
export async function notifySalespersonOnProposalEvent(params: NotifySalespersonOnProposalEventParams): Promise<void> {
  try {
    const lead = await prisma.salesLead.findUnique({ where: { id: params.salesLeadId }, select: { assignedToId: true, createdById: true } });
    const recipientTeamMemberId = lead?.assignedToId ?? lead?.createdById;
    if (!recipientTeamMemberId) return;

    const teamMember = await prisma.teamMember.findUnique({ where: { id: recipientTeamMemberId }, select: { userId: true } });
    if (!teamMember?.userId) return;

    await createNotification({
      userId: teamMember.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: `/admin/sales-crm/leads/${params.salesLeadId}`,
    });
  } catch (error) {
    console.error("notifySalespersonOnProposalEvent failed:", error);
  }
}
