"use server";

import { revalidatePath } from "next/cache";
import type { OfferingRequest, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/actions/leads";
import { validateStep, validateAllSteps } from "../validation/step-schemas";
import { TOP_LEVEL_FIELDS, getStepIndex, STEPS_BY_TYPE } from "../lib/steps-config";
import { emitOfferingRequestEvent } from "../lib/events";
import { createOperationItemForRequest } from "@/features/operations/server/creation";

type OwnedDraftResult =
  | { ok: true; request: OfferingRequest; userId: string }
  | { ok: false; error: string };

/**
 * Every action here re-checks ownership from the session, never trusting a
 * client-supplied userId - the brief's "no client-side trust" requirement,
 * same discipline src/actions/crm.ts's resolveActorId() follows for CRM
 * actions.
 */
async function requireOwnedDraft(requestId: string): Promise<OwnedDraftResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }
  const request = await prisma.offeringRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
  });
  if (!request) {
    return { ok: false, error: "Request not found." };
  }
  if (request.status !== "DRAFT") {
    return { ok: false, error: "This request has already been submitted." };
  }
  return { ok: true, request, userId: session.user.id };
}

export type SaveStepResult = ActionResult & { currentStep?: number };

/**
 * Saves one wizard step. `advance: true` (Next button) bumps currentStep
 * and lets validation errors block progress; `advance: false` (idle
 * autosave) persists whatever's typed so far without validating strictly
 * or moving the resume point - a half-filled optional field shouldn't
 * block autosave, only Next/Submit enforce the real rules.
 */
export async function saveRequestStep(
  requestId: string,
  stepKey: string,
  raw: Record<string, string>,
  advance: boolean
): Promise<SaveStepResult> {
  const owned = await requireOwnedDraft(requestId);
  if (!owned.ok) {
    return { success: false, error: owned.error };
  }
  const { request } = owned;

  let dataToSave: Record<string, string> = raw;

  if (advance) {
    const result = validateStep(stepKey, raw);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    dataToSave = result.data;
  }

  const currentDetails = (request.details as Record<string, unknown> | null) ?? {};
  const topLevelUpdate: Prisma.OfferingRequestUpdateInput = {};
  const detailsUpdate: Record<string, unknown> = { ...currentDetails };

  for (const [key, value] of Object.entries(dataToSave)) {
    if (TOP_LEVEL_FIELDS.has(key)) {
      if (key === "preferredContactMethod") {
        // Idle autosave (advance: false) persists whatever's typed so far,
        // including an unselected Select's empty-string value - Prisma
        // rejects "" for an enum column, so only a real, non-empty choice
        // is ever written here. Next/Submit's strict validation (above)
        // still requires a real value before advancing.
        if (value) topLevelUpdate.preferredContactMethod = value as never;
      } else if (key === "preferredMeetingTime") {
        topLevelUpdate.preferredMeetingTime = value;
      }
    } else {
      detailsUpdate[key] = value;
    }
  }

  const stepIndex = getStepIndex(request.requestType, stepKey);
  const nextStep = advance
    ? Math.min(stepIndex + 2, STEPS_BY_TYPE[request.requestType].length + 1)
    : request.currentStep;

  try {
    await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        ...topLevelUpdate,
        details: detailsUpdate as Prisma.InputJsonValue,
        currentStep: Math.max(request.currentStep, nextStep),
      },
    });
    revalidatePath(`/student/requests/${requestId}`);
    revalidatePath(`/client/requests/${requestId}`);
    return { success: true, currentStep: Math.max(request.currentStep, nextStep) };
  } catch (error) {
    console.error("saveRequestStep failed:", error);
    return { success: false, error: "Couldn't save - please try again." };
  }
}

export type SubmitRequestResult = ActionResult & { requestId?: string };

export async function submitRequest(requestId: string): Promise<SubmitRequestResult> {
  const owned = await requireOwnedDraft(requestId);
  if (!owned.ok) {
    return { success: false, error: owned.error };
  }
  const { request } = owned;

  const merged: Record<string, unknown> = {
    ...(request.details as Record<string, unknown> | null),
    ...(request.preferredContactMethod ? { preferredContactMethod: request.preferredContactMethod } : {}),
    ...(request.preferredMeetingTime ? { preferredMeetingTime: request.preferredMeetingTime } : {}),
  };

  const validation = validateAllSteps(request.requestType, merged);
  if (!validation.success) {
    return {
      success: false,
      error: `Please complete "${validation.stepKey}" before submitting: ${validation.error}`,
    };
  }

  try {
    const updated = await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        history: {
          create: { eventType: "SUBMITTED", fromStatus: "DRAFT", toStatus: "SUBMITTED" },
        },
      },
    });
    emitOfferingRequestEvent("REQUEST_SUBMITTED", updated);

    // Non-fatal by design (Phase 7's Operations Engine) - a failure to
    // create the internal Operations pointer row must never block the
    // customer's request from actually submitting.
    try {
      await createOperationItemForRequest(updated);
    } catch (error) {
      console.error("createOperationItemForRequest failed:", error);
    }

    revalidatePath("/student/requests");
    revalidatePath("/client/requests");
    return { success: true, requestId: updated.id };
  } catch (error) {
    console.error("submitRequest failed:", error);
    return { success: false, error: "Couldn't submit - please try again." };
  }
}

export async function cancelDraft(requestId: string): Promise<ActionResult> {
  const owned = await requireOwnedDraft(requestId);
  if (!owned.ok) {
    return { success: false, error: owned.error };
  }

  try {
    await prisma.offeringRequest.update({
      where: { id: requestId },
      data: {
        status: "CANCELLED",
        history: { create: { eventType: "CANCELLED", fromStatus: "DRAFT", toStatus: "CANCELLED" } },
      },
    });
    revalidatePath("/student/requests");
    revalidatePath("/client/requests");
    return { success: true };
  } catch (error) {
    console.error("cancelDraft failed:", error);
    return { success: false, error: "Couldn't cancel - please try again." };
  }
}
