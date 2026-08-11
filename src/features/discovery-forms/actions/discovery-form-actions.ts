"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import {
  sendDiscoveryFormSchema,
  submitDiscoveryFormByTokenSchema,
  submitDiscoveryFormAuthenticatedSchema,
} from "../validation/discovery-form-schemas";
import { generateDiscoveryFormToken, computeDiscoveryFormExpiry } from "../lib/token";
import { sendDiscoveryFormEmail, notifyDiscoveryFormSubmitted } from "../server/notify";
import { resolveDiscoveryFormToken } from "../server/token-queries";

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const member = await prisma.teamMember.findUnique({ where: { userId } });
  return member?.id;
}

export type SendDiscoveryFormResult = ActionResult & { formId?: string };

/** Admin-initiated - creates a fresh DiscoveryForm (never reuses a DRAFT row) and emails the client the token link. Resending an already-sent (or expired) form is a separate action (resendDiscoveryForm) that mints a fresh token/expiry on the same row rather than creating a second form. */
export async function sendDiscoveryForm(input: unknown): Promise<SendDiscoveryFormResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = sendDiscoveryFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: data.salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const project = data.salesProjectId
      ? await prisma.salesProject.findUnique({ where: { id: data.salesProjectId }, select: { id: true, name: true, salesLeadId: true } })
      : null;
    if (data.salesProjectId && project?.salesLeadId !== data.salesLeadId) {
      return { success: false, error: "That project doesn't belong to this lead." };
    }

    const actorId = await actorTeamMemberId(user.id);

    const form = await prisma.discoveryForm.create({
      data: {
        salesLeadId: data.salesLeadId,
        salesProjectId: data.salesProjectId,
        token: generateDiscoveryFormToken(),
        expiresAt: computeDiscoveryFormExpiry(),
        status: "SENT",
        sentAt: new Date(),
        sentById: actorId,
      },
    });

    await sendDiscoveryFormEmail(form, lead, project?.name);
    await logSalesLeadActivity({ salesLeadId: data.salesLeadId, type: "NOTE_ADDED", description: "Discovery form sent", performedById: actorId });

    revalidatePath(`/admin/sales-crm/leads/${data.salesLeadId}`);
    revalidatePath(`/sales/leads/${data.salesLeadId}`);
    return { success: true, formId: form.id };
  } catch (error) {
    console.error("sendDiscoveryForm failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Re-sends a discovery form - always issues a genuinely NEW token + expiry
 * on the same row (old token dies immediately, since it's overwritten, not
 * duplicated) and resets status to SENT/openedAt to null. Previously this
 * re-mailed the exact same link, which meant resending an EXPIRED form did
 * nothing - the client got a fresh email pointing at a still-dead link.
 * Never touches any already-filled content fields, so a client mid-way
 * through the authenticated in-portal path (which doesn't use the token at
 * all) loses nothing.
 */
export async function resendDiscoveryForm(formId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const form = await prisma.discoveryForm.findUnique({ where: { id: formId }, include: { salesLead: true } });
    if (!form) return { success: false, error: "Form not found." };
    if (!viewer.hasFullAccess && form.salesLead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Form not found." };
    }
    if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
      return { success: false, error: "This form has already been submitted." };
    }

    const refreshed = await prisma.discoveryForm.update({
      where: { id: formId },
      data: {
        token: generateDiscoveryFormToken(),
        expiresAt: computeDiscoveryFormExpiry(),
        status: "SENT",
        sentAt: new Date(),
        openedAt: null,
      },
    });

    const project = form.salesProjectId
      ? await prisma.salesProject.findUnique({ where: { id: form.salesProjectId }, select: { name: true } })
      : null;
    await sendDiscoveryFormEmail(refreshed, form.salesLead, project?.name);

    revalidatePath(`/admin/sales-crm/leads/${form.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("resendDiscoveryForm failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin marks a submitted form reviewed - the last stage in the Draft/Sent/Opened/In Progress/Submitted/Reviewed lifecycle, purely a human "I've looked at this" signal, no downstream automation attached. */
export async function markDiscoveryFormReviewed(formId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const form = await prisma.discoveryForm.findUnique({ where: { id: formId }, select: { salesLeadId: true, status: true, salesLead: { select: { assignedToId: true } } } });
    if (!form) return { success: false, error: "Form not found." };
    if (!viewer.hasFullAccess && form.salesLead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Form not found." };
    }
    if (form.status !== "SUBMITTED") return { success: false, error: "Only a submitted form can be marked reviewed." };

    const actorId = await actorTeamMemberId(user.id);
    await prisma.discoveryForm.update({ where: { id: formId }, data: { status: "REVIEWED", reviewedAt: new Date(), reviewedById: actorId } });
    await logSalesLeadActivity({ salesLeadId: form.salesLeadId, type: "NOTE_ADDED", description: "Discovery form reviewed", performedById: actorId });

    revalidatePath(`/admin/sales-crm/leads/${form.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("markDiscoveryFormReviewed failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Public, unauthenticated submission via the token link. Positional
 * (token, content) signature - not a single object - so the public page can
 * pass `submitDiscoveryFormByToken.bind(null, token)` straight as
 * DiscoveryFormFields' onSubmit prop, same convention as
 * sendMessageToStaffContent.bind(null, salesLeadId) elsewhere in this
 * codebase, rather than defining a one-off inline "use server" closure.
 */
export async function submitDiscoveryFormByToken(token: string, contentInput: unknown): Promise<ActionResult> {
  const parsed = submitDiscoveryFormByTokenSchema.safeParse({ token, content: contentInput });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { content } = parsed.data;

  try {
    const resolution = await resolveDiscoveryFormToken(token);
    if (resolution.status === "not_found") return { success: false, error: "This link isn't valid." };
    if (resolution.status === "expired") return { success: false, error: "This link has expired." };
    if (resolution.status === "already_submitted") return { success: false, error: "This form has already been submitted." };

    await prisma.discoveryForm.update({
      where: { id: resolution.form.id },
      data: { ...content, status: "SUBMITTED", submittedAt: new Date() },
    });

    await logSalesLeadActivity({ salesLeadId: resolution.form.salesLeadId, type: "NOTE_ADDED", description: "Discovery form submitted by client" });
    const lead = await prisma.salesLead.findUnique({ where: { id: resolution.form.salesLeadId } });
    if (lead) await notifyDiscoveryFormSubmitted(lead);

    revalidatePath(`/discovery/${token}`);
    return { success: true };
  } catch (error) {
    console.error("submitDiscoveryFormByToken failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Authenticated client-portal submission - same content shape and positional-args reasoning as submitDiscoveryFormByToken above, scoped via ClientWorkspaceViewer so a client can only ever submit a form on their own lead. */
export async function submitDiscoveryFormAuthenticated(formId: string, contentInput: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const parsed = submitDiscoveryFormAuthenticatedSchema.safeParse({ formId, content: contentInput });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { content } = parsed.data;

  try {
    const viewer = await resolveClientWorkspaceViewer(session.user.id);
    const form = await prisma.discoveryForm.findUnique({ where: { id: formId } });
    if (!form || !viewer.salesLeadIds.includes(form.salesLeadId)) return { success: false, error: "Form not found." };
    if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
      return { success: false, error: "This form has already been submitted." };
    }

    await prisma.discoveryForm.update({
      where: { id: formId },
      data: { ...content, status: "SUBMITTED", submittedAt: new Date() },
    });

    await logSalesLeadActivity({ salesLeadId: form.salesLeadId, type: "NOTE_ADDED", description: "Discovery form submitted by client" });
    const lead = await prisma.salesLead.findUnique({ where: { id: form.salesLeadId } });
    if (lead) await notifyDiscoveryFormSubmitted(lead);

    revalidatePath(`/client/projects/${form.salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("submitDiscoveryFormAuthenticated failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
