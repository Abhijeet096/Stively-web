"use server";

import { revalidatePath } from "next/cache";

import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { resolveClientWorkspaceViewer } from "@/features/client-workspace/server/rbac";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import { sendOnboardingFormSchema, onboardingFormContentSchema } from "../validation/onboarding-form-schemas";
import { generateOnboardingFormToken, computeOnboardingFormExpiry } from "../lib/token";
import { sendOnboardingFormEmail, notifyOnboardingFormSubmitted } from "../server/notify";
import { resolveOnboardingFormToken } from "../server/token-queries";
import { uploadOnboardingFormFiles, type UploadWarning } from "../server/upload-files";

/** SalesProject has no email of its own - the client's email lives on the originating SalesLead, so every caller that needs to send mail pulls it via this include rather than duplicating it onto the project. */
async function assertProjectAccess(salesProjectId: string, userId: string, role: Role) {
  const viewer = await resolveSalesCrmViewer(userId, role);
  const project = await prisma.salesProject.findUnique({
    where: { id: salesProjectId },
    include: { salesLead: { select: { email: true } } },
  });
  if (!project) return { ok: false as const, error: "Project not found." };
  if (!viewer.hasFullAccess && project.salesPersonId !== viewer.teamMemberId) {
    return { ok: false as const, error: "Project not found." };
  }
  return { ok: true as const, project };
}

async function actorTeamMemberId(userId: string): Promise<string | undefined> {
  const member = await prisma.teamMember.findUnique({ where: { userId } });
  return member?.id;
}

/** Every text field in onboardingFormContentSchema, read off FormData - separate from the schema itself since FormData values are always strings/File, never booleans or Dates. */
const TEXT_FIELDS = [
  "preparedBy",
  "company",
  "primaryContact",
  "email",
  "phone",
  "billingInfo",
  "projectName",
  "targetAudience",
  "approvedScope",
  "primaryObjective",
  "brandColors",
  "brandFonts",
  "domainRegistrar",
  "hostingProvider",
  "githubOrg",
  "cloudInfrastructure",
  "apiCredentialsNeeded",
  "thirdPartyServices",
  "productInformation",
  "legalPages",
  "primaryCommunicationChannel",
  "primaryDecisionMaker",
  "reviewApprovalContact",
  "expectedMilestoneDates",
  "notes",
] as const;

/** Converts the raw FormData a submitted <form> posts into the plain object onboardingFormContentSchema expects - files are handled separately by uploadOnboardingFormFiles, not part of this shape. */
function parseOnboardingFormContent(formData: FormData): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") raw[field] = value;
  }
  const formDate = formData.get("formDate");
  if (typeof formDate === "string" && formDate) raw.formDate = formDate;
  const projectStartDate = formData.get("projectStartDate");
  if (typeof projectStartDate === "string") raw.projectStartDate = projectStartDate;
  raw.confirmedAccurate = formData.get("confirmedAccurate") === "on";
  return raw;
}

export type SendOnboardingFormResult = ActionResult & { formId?: string };

/** Admin-initiated - creates a fresh OnboardingForm for the project (never reuses a DRAFT row) and emails the client the token link. Resending is a separate action (resendOnboardingForm) that mints a fresh token/expiry on the same row. */
export async function sendOnboardingForm(input: unknown): Promise<SendOnboardingFormResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = sendOnboardingFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  try {
    const access = await assertProjectAccess(data.salesProjectId, user.id, user.role);
    if (!access.ok) return { success: false, error: access.error };

    const actorId = await actorTeamMemberId(user.id);

    const form = await prisma.onboardingForm.create({
      data: {
        salesProjectId: data.salesProjectId,
        token: generateOnboardingFormToken(),
        expiresAt: computeOnboardingFormExpiry(),
        status: "SENT",
        sentAt: new Date(),
        sentById: actorId,
        company: access.project.clientName,
        projectName: access.project.name,
      },
    });

    await sendOnboardingFormEmail(form, access.project, access.project.salesLead.email);
    await logSalesLeadActivity({ salesLeadId: access.project.salesLeadId, type: "NOTE_ADDED", description: "Onboarding form sent", performedById: actorId });

    revalidatePath(`/admin/sales-crm/projects/${data.salesProjectId}`);
    revalidatePath(`/sales/projects/${data.salesProjectId}`);
    return { success: true, formId: form.id };
  } catch (error) {
    console.error("sendOnboardingForm failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Re-sends an onboarding form - mints a genuinely new token + expiry on the
 * same row and resets status to SENT/openedAt to null, same fix as
 * resendDiscoveryForm (AD-016): re-mailing the same dead link after
 * expiry accomplished nothing.
 */
export async function resendOnboardingForm(formId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const form = await prisma.onboardingForm.findUnique({
      where: { id: formId },
      include: { salesProject: { include: { salesLead: { select: { email: true } } } } },
    });
    if (!form) return { success: false, error: "Form not found." };
    if (!viewer.hasFullAccess && form.salesProject.salesPersonId !== viewer.teamMemberId) {
      return { success: false, error: "Form not found." };
    }
    if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
      return { success: false, error: "This form has already been submitted." };
    }

    const refreshed = await prisma.onboardingForm.update({
      where: { id: formId },
      data: {
        token: generateOnboardingFormToken(),
        expiresAt: computeOnboardingFormExpiry(),
        status: "SENT",
        sentAt: new Date(),
        openedAt: null,
      },
    });

    await sendOnboardingFormEmail(refreshed, form.salesProject, form.salesProject.salesLead.email);

    revalidatePath(`/admin/sales-crm/projects/${form.salesProjectId}`);
    revalidatePath(`/sales/projects/${form.salesProjectId}`);
    return { success: true };
  } catch (error) {
    console.error("resendOnboardingForm failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Admin marks a submitted form reviewed - a human "I've looked at this" signal, no downstream automation attached. */
export async function markOnboardingFormReviewed(formId: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const form = await prisma.onboardingForm.findUnique({
      where: { id: formId },
      select: { salesProjectId: true, status: true, salesProject: { select: { salesPersonId: true, salesLeadId: true } } },
    });
    if (!form) return { success: false, error: "Form not found." };
    if (!viewer.hasFullAccess && form.salesProject.salesPersonId !== viewer.teamMemberId) {
      return { success: false, error: "Form not found." };
    }
    if (form.status !== "SUBMITTED") return { success: false, error: "Only a submitted form can be marked reviewed." };

    const actorId = await actorTeamMemberId(user.id);
    await prisma.onboardingForm.update({ where: { id: formId }, data: { status: "REVIEWED", reviewedAt: new Date(), reviewedById: actorId } });
    await logSalesLeadActivity({ salesLeadId: form.salesProject.salesLeadId, type: "NOTE_ADDED", description: "Onboarding form reviewed", performedById: actorId });

    revalidatePath(`/admin/sales-crm/projects/${form.salesProjectId}`);
    return { success: true };
  } catch (error) {
    console.error("markOnboardingFormReviewed failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type SubmitOnboardingFormResult = ActionResult & { warnings?: UploadWarning[] };

/**
 * Public, unauthenticated submission via the token link. Takes FormData
 * directly (not a plain content object like DiscoveryForm's actions) since
 * this form carries real File uploads alongside its text fields in one
 * submission - same convention as loginUser/registerUser's
 * (prevState, formData) shape, minus the useActionState prevState since
 * this is invoked as `submitOnboardingFormByToken.bind(null, token)`.
 */
export async function submitOnboardingFormByToken(token: string, formData: FormData): Promise<SubmitOnboardingFormResult> {
  const parsed = onboardingFormContentSchema.safeParse(parseOnboardingFormContent(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const content = parsed.data;

  try {
    const resolution = await resolveOnboardingFormToken(token);
    if (resolution.status === "not_found") return { success: false, error: "This link isn't valid." };
    if (resolution.status === "expired") return { success: false, error: "This link has expired." };
    if (resolution.status === "already_submitted") return { success: false, error: "This form has already been submitted." };

    await prisma.onboardingForm.update({
      where: { id: resolution.form.id },
      data: { ...content, status: "SUBMITTED", submittedAt: new Date() },
    });
    const warnings = await uploadOnboardingFormFiles(resolution.form.id, formData);

    await logSalesLeadActivity({ salesLeadId: resolution.form.salesProject.salesLeadId, type: "NOTE_ADDED", description: "Onboarding form submitted by client" });
    await notifyOnboardingFormSubmitted(resolution.form.salesProject);

    revalidatePath(`/onboarding/${token}`);
    return { success: true, warnings: warnings.length ? warnings : undefined };
  } catch (error) {
    console.error("submitOnboardingFormByToken failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Authenticated client-portal submission - same content/file handling as submitOnboardingFormByToken, scoped via ClientWorkspaceViewer so a client can only ever submit a form on their own project. */
export async function submitOnboardingFormAuthenticated(formId: string, formData: FormData): Promise<SubmitOnboardingFormResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const parsed = onboardingFormContentSchema.safeParse(parseOnboardingFormContent(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const content = parsed.data;

  try {
    const viewer = await resolveClientWorkspaceViewer(session.user.id);
    const form = await prisma.onboardingForm.findUnique({ where: { id: formId }, include: { salesProject: true } });
    if (!form || !viewer.salesLeadIds.includes(form.salesProject.salesLeadId)) return { success: false, error: "Form not found." };
    if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
      return { success: false, error: "This form has already been submitted." };
    }

    await prisma.onboardingForm.update({
      where: { id: formId },
      data: { ...content, status: "SUBMITTED", submittedAt: new Date() },
    });
    const warnings = await uploadOnboardingFormFiles(formId, formData);

    await logSalesLeadActivity({ salesLeadId: form.salesProject.salesLeadId, type: "NOTE_ADDED", description: "Onboarding form submitted by client" });
    await notifyOnboardingFormSubmitted(form.salesProject);

    revalidatePath(`/client/projects/${form.salesProject.salesLeadId}`);
    return { success: true, warnings: warnings.length ? warnings : undefined };
  } catch (error) {
    console.error("submitOnboardingFormAuthenticated failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
