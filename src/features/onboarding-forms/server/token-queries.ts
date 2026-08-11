import "server-only";

import { prisma } from "@/lib/prisma";
import type { OnboardingForm, SalesProject } from "@prisma/client";

export type ResolvedOnboardingForm = OnboardingForm & {
  salesProject: Pick<SalesProject, "id" | "name" | "clientName" | "salesLeadId">;
};

export type OnboardingFormResolution =
  | { status: "valid"; form: ResolvedOnboardingForm }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "already_submitted"; form: ResolvedOnboardingForm };

/**
 * The one function the public /onboarding/[token] route resolves through -
 * same closed-union shape as resolveDiscoveryFormToken, so the page renders
 * a specific, honest message instead of a generic 404. Persists EXPIRED on
 * first detection (see AD-016's fix - never leave expiry ephemeral-only).
 */
export async function resolveOnboardingFormToken(token: string): Promise<OnboardingFormResolution> {
  const form = await prisma.onboardingForm.findUnique({
    where: { token },
    include: { salesProject: { select: { id: true, name: true, clientName: true, salesLeadId: true } } },
  });
  if (!form) return { status: "not_found" };

  if (form.expiresAt && form.expiresAt < new Date() && form.status !== "SUBMITTED" && form.status !== "REVIEWED") {
    if (form.status !== "EXPIRED") {
      await prisma.onboardingForm.update({ where: { id: form.id }, data: { status: "EXPIRED" } });
    }
    return { status: "expired" };
  }

  if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
    return { status: "already_submitted", form };
  }

  return { status: "valid", form };
}

/** First-open tracking - SENT -> OPENED on the first real view, same "write on read, never regress a later status" precedent as recordDiscoveryFormOpen. */
export async function recordOnboardingFormOpen(formId: string): Promise<void> {
  const form = await prisma.onboardingForm.findUnique({ where: { id: formId }, select: { status: true, openedAt: true } });
  if (!form || form.status !== "SENT") return;

  await prisma.onboardingForm.update({
    where: { id: formId },
    data: { status: "OPENED", openedAt: form.openedAt ?? new Date() },
  });
}
